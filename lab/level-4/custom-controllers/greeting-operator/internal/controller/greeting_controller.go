package controller

import (
	"context"
	"crypto/sha256"
	"errors"
	"fmt"
	"html"
	"reflect"
	"regexp"
	"time"
	"unicode/utf8"

	learningv1alpha1 "example.com/k8s-visual-ops-lab/greeting-operator/api/v1alpha1"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/equality"
	apimeta "k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/util/intstr"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
)

var ErrOwnership = errors.New("child is not controlled by this Greeting UID")
var greetingNamePattern = regexp.MustCompile(`^[a-z]([-a-z0-9]*[a-z0-9])?$`)

type GreetingReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

func (r *GreetingReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	var greeting learningv1alpha1.Greeting
	if err := r.Get(ctx, req.NamespacedName, &greeting); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}
	if !greeting.DeletionTimestamp.IsZero() {
		return ctrl.Result{}, nil
	}
	if greeting.Spec.Paused {
		return ctrl.Result{}, r.publishStatus(ctx, &greeting, greeting.Status.ReadyReplicas, metav1.ConditionFalse, "Paused", "Reconciliation is paused; child availability is the last observation and may be stale")
	}
	if utf8.RuneCountInString(greeting.Spec.Message) < 1 || utf8.RuneCountInString(greeting.Spec.Message) > 200 || greeting.Spec.Replicas < 1 || greeting.Spec.Replicas > 3 || len(greeting.Name) > 50 || !greetingNamePattern.MatchString(greeting.Name) {
		return ctrl.Result{}, r.publishStatus(ctx, &greeting, 0, metav1.ConditionFalse, "InvalidSpec", "Message, replica count or name violates the API contract")
	}

	deployment, err := r.ensureChildren(ctx, &greeting)
	if err != nil {
		statusErr := r.publishStatus(ctx, &greeting, 0, metav1.ConditionFalse, "ReconcileFailed", err.Error())
		return ctrl.Result{}, errors.Join(err, statusErr)
	}
	desired := greeting.Spec.Replicas
	ready := deployment.Status.ObservedGeneration >= deployment.Generation &&
		deployment.Status.Replicas == desired && deployment.Status.UpdatedReplicas == desired &&
		deployment.Status.ReadyReplicas == desired && deployment.Status.AvailableReplicas == desired
	condition, reason, message := metav1.ConditionFalse, "Progressing", "Waiting for the current Deployment generation to become fully available"
	if ready {
		condition, reason, message = metav1.ConditionTrue, "Converged", "Desired replicas are updated, ready and available"
	}
	if err := r.publishStatus(ctx, &greeting, deployment.Status.ReadyReplicas, condition, reason, message); err != nil {
		return ctrl.Result{}, err
	}
	if !ready {
		return ctrl.Result{RequeueAfter: 5 * time.Second}, nil
	}
	return ctrl.Result{}, nil
}

func labels(greeting *learningv1alpha1.Greeting) map[string]string {
	return map[string]string{"app.kubernetes.io/name": "greeting", "app.kubernetes.io/instance": greeting.Name}
}

func (r *GreetingReconciler) own(greeting *learningv1alpha1.Greeting, child client.Object) error {
	// A matching name does not authorize adoption of an existing foreign object.
	if child.GetResourceVersion() != "" && !metav1.IsControlledBy(child, greeting) {
		return fmt.Errorf("%w: %T %s/%s", ErrOwnership, child, child.GetNamespace(), child.GetName())
	}
	if child.GetLabels() == nil {
		child.SetLabels(map[string]string{})
	}
	for key, value := range labels(greeting) {
		child.GetLabels()[key] = value
	}
	return controllerutil.SetControllerReference(greeting, child, r.Scheme)
}

func (r *GreetingReconciler) ensureChildren(ctx context.Context, greeting *learningv1alpha1.Greeting) (*appsv1.Deployment, error) {
	config := &corev1.ConfigMap{ObjectMeta: metav1.ObjectMeta{Name: greeting.Name + "-content", Namespace: greeting.Namespace}}
	if _, err := controllerutil.CreateOrUpdate(ctx, r.Client, config, func() error {
		if err := r.own(greeting, config); err != nil {
			return err
		}
		if config.Data == nil {
			config.Data = map[string]string{}
		}
		config.Data["index.html"] = html.EscapeString(greeting.Spec.Message)
		return nil
	}); err != nil {
		return nil, fmt.Errorf("reconcile ConfigMap: %w", err)
	}

	deployment := &appsv1.Deployment{ObjectMeta: metav1.ObjectMeta{Name: greeting.Name, Namespace: greeting.Namespace}}
	if _, err := controllerutil.CreateOrUpdate(ctx, r.Client, deployment, func() error {
		if err := r.own(greeting, deployment); err != nil {
			return err
		}
		selector := labels(greeting)
		if deployment.Spec.Selector != nil && !reflect.DeepEqual(deployment.Spec.Selector.MatchLabels, selector) {
			return errors.New("existing owned Deployment selector differs; an explicit migration is required")
		}
		deployment.Spec.Selector = &metav1.LabelSelector{MatchLabels: selector}
		deployment.Spec.Replicas = &greeting.Spec.Replicas
		if deployment.Spec.Template.Labels == nil {
			deployment.Spec.Template.Labels = map[string]string{}
		}
		for key, value := range selector {
			deployment.Spec.Template.Labels[key] = value
		}
		if deployment.Spec.Template.Annotations == nil {
			deployment.Spec.Template.Annotations = map[string]string{}
		}
		deployment.Spec.Template.Annotations["learning.k8svisual.dev/message-sha"] = fmt.Sprintf("%x", sha256.Sum256([]byte(greeting.Spec.Message)))
		no, yes, user, mode := false, true, int64(1000), int32(0444)
		pod := &deployment.Spec.Template.Spec
		pod.AutomountServiceAccountToken = &no
		pod.SecurityContext = &corev1.PodSecurityContext{RunAsNonRoot: &yes, RunAsUser: &user, SeccompProfile: &corev1.SeccompProfile{Type: corev1.SeccompProfileTypeRuntimeDefault}}
		// Set API-defaulted container fields explicitly to avoid perpetual update loops.
		pod.Containers = []corev1.Container{{
			Name: "web", Image: "busybox:1.37.0", ImagePullPolicy: corev1.PullIfNotPresent,
			Command:                []string{"httpd", "-f", "-p", "8080", "-h", "/site"},
			Ports:                  []corev1.ContainerPort{{Name: "http", ContainerPort: 8080, Protocol: corev1.ProtocolTCP}},
			ReadinessProbe:         &corev1.Probe{ProbeHandler: corev1.ProbeHandler{HTTPGet: &corev1.HTTPGetAction{Path: "/", Port: intstr.FromString("http"), Scheme: corev1.URISchemeHTTP}}, PeriodSeconds: 2, TimeoutSeconds: 1, SuccessThreshold: 1, FailureThreshold: 3},
			SecurityContext:        &corev1.SecurityContext{AllowPrivilegeEscalation: &no, ReadOnlyRootFilesystem: &yes, Capabilities: &corev1.Capabilities{Drop: []corev1.Capability{"ALL"}}},
			Resources:              corev1.ResourceRequirements{},
			VolumeMounts:           []corev1.VolumeMount{{Name: "content", MountPath: "/site", ReadOnly: true}},
			TerminationMessagePath: "/dev/termination-log", TerminationMessagePolicy: corev1.TerminationMessageReadFile,
		}}
		pod.Containers[0].Resources.Requests = resourceRequests()
		pod.Containers[0].Resources.Limits = resourceLimits()
		pod.Volumes = []corev1.Volume{{Name: "content", VolumeSource: corev1.VolumeSource{ConfigMap: &corev1.ConfigMapVolumeSource{LocalObjectReference: corev1.LocalObjectReference{Name: config.Name}, DefaultMode: &mode}}}}
		return nil
	}); err != nil {
		return nil, fmt.Errorf("reconcile Deployment: %w", err)
	}

	service := &corev1.Service{ObjectMeta: metav1.ObjectMeta{Name: greeting.Name, Namespace: greeting.Namespace}}
	if _, err := controllerutil.CreateOrUpdate(ctx, r.Client, service, func() error {
		if err := r.own(greeting, service); err != nil {
			return err
		}
		service.Spec.Type = corev1.ServiceTypeClusterIP
		service.Spec.Selector = labels(greeting)
		service.Spec.Ports = []corev1.ServicePort{{Name: "http", Protocol: corev1.ProtocolTCP, Port: 8080, TargetPort: intstr.FromString("http")}}
		return nil
	}); err != nil {
		return nil, fmt.Errorf("reconcile Service: %w", err)
	}
	return deployment, nil
}

func (r *GreetingReconciler) publishStatus(ctx context.Context, greeting *learningv1alpha1.Greeting, ready int32, status metav1.ConditionStatus, reason, message string) error {
	before := greeting.DeepCopy()
	greeting.Status.ObservedGeneration = greeting.Generation
	greeting.Status.ReadyReplicas = ready
	apimeta.SetStatusCondition(&greeting.Status.Conditions, metav1.Condition{Type: "Ready", Status: status, Reason: reason, Message: message, ObservedGeneration: greeting.Generation})
	if equality.Semantic.DeepEqual(before.Status, greeting.Status) {
		return nil
	}
	return r.Status().Patch(ctx, greeting, client.MergeFromWithOptions(before, client.MergeFromWithOptimisticLock{}))
}

func (r *GreetingReconciler) SetupWithManager(manager ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(manager).For(&learningv1alpha1.Greeting{}).
		Owns(&corev1.ConfigMap{}).Owns(&appsv1.Deployment{}).Owns(&corev1.Service{}).Complete(r)
}
