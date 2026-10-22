package controller

import (
	"context"
	"errors"
	"testing"

	learningv1alpha1 "example.com/k8s-visual-ops-lab/greeting-operator/api/v1alpha1"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	apimeta "k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
)

var testContext = context.Background()
var testKey = types.NamespacedName{Namespace: "lab-operator", Name: "hello"}

func setup(t *testing.T, extras ...client.Object) (*GreetingReconciler, client.Client) {
	t.Helper()
	scheme := runtime.NewScheme()
	for _, add := range []func(*runtime.Scheme) error{corev1.AddToScheme, appsv1.AddToScheme, learningv1alpha1.AddToScheme} {
		if err := add(scheme); err != nil {
			t.Fatal(err)
		}
	}
	greeting := &learningv1alpha1.Greeting{ObjectMeta: metav1.ObjectMeta{Name: testKey.Name, Namespace: testKey.Namespace, UID: "greeting-uid", Generation: 3}, Spec: learningv1alpha1.GreetingSpec{Message: "hello", Replicas: 1}}
	objects := append([]client.Object{greeting}, extras...)
	c := fake.NewClientBuilder().WithScheme(scheme).WithStatusSubresource(&learningv1alpha1.Greeting{}, &appsv1.Deployment{}).WithObjects(objects...).Build()
	return &GreetingReconciler{Client: c, Scheme: scheme}, c
}

func reconcile(t *testing.T, r *GreetingReconciler) ctrl.Result {
	t.Helper()
	result, err := r.Reconcile(testContext, ctrl.Request{NamespacedName: testKey})
	if err != nil {
		t.Fatal(err)
	}
	return result
}

func TestCreateAndRepeatedReconcileDoesNotWrite(t *testing.T) {
	r, c := setup(t)
	if result := reconcile(t, r); result.RequeueAfter == 0 {
		t.Fatal("an unready Deployment needs another observation")
	}
	objects := []client.Object{&learningv1alpha1.Greeting{}, &appsv1.Deployment{}, &corev1.Service{}, &corev1.ConfigMap{}}
	versions := make([]string, len(objects))
	for i, obj := range objects {
		key := testKey
		if _, ok := obj.(*corev1.ConfigMap); ok {
			key.Name += "-content"
		}
		if err := c.Get(testContext, key, obj); err != nil {
			t.Fatal(err)
		}
		versions[i] = obj.GetResourceVersion()
		if i > 0 && !metav1.IsControlledBy(obj, objects[0]) {
			t.Fatal("child owner does not match Greeting UID")
		}
	}
	greeting := objects[0].(*learningv1alpha1.Greeting)
	if greeting.Status.ObservedGeneration != 3 || !apimeta.IsStatusConditionFalse(greeting.Status.Conditions, "Ready") {
		t.Fatal("initial status must describe pending generation 3")
	}
	reconcile(t, r)
	for i, obj := range objects {
		if err := c.Get(testContext, client.ObjectKeyFromObject(obj), obj); err != nil {
			t.Fatal(err)
		}
		if obj.GetResourceVersion() != versions[i] {
			t.Fatalf("repeat reconciliation wrote %T unnecessarily", obj)
		}
	}
}

type countWritesClient struct {
	client.Client
	writes int
}

func (c *countWritesClient) Create(ctx context.Context, obj client.Object, options ...client.CreateOption) error {
	c.writes++
	return c.Client.Create(ctx, obj, options...)
}

func (c *countWritesClient) Update(ctx context.Context, obj client.Object, options ...client.UpdateOption) error {
	c.writes++
	return c.Client.Update(ctx, obj, options...)
}

func (c *countWritesClient) Status() client.SubResourceWriter {
	return &countStatusWriter{SubResourceWriter: c.Client.Status(), owner: c}
}

type countStatusWriter struct {
	client.SubResourceWriter
	owner *countWritesClient
}

func (s *countStatusWriter) Patch(ctx context.Context, obj client.Object, patch client.Patch, options ...client.SubResourcePatchOption) error {
	s.owner.writes++
	return s.SubResourceWriter.Patch(ctx, obj, patch, options...)
}

func TestConvergedInputsProduceNoWriteCalls(t *testing.T) {
	r, c := setup(t)
	reconcile(t, r)
	counted := &countWritesClient{Client: c}
	r.Client = counted
	reconcile(t, r)
	if counted.writes != 0 {
		t.Fatalf("unchanged inputs made %d write calls", counted.writes)
	}
}

func TestDesiredChangeUpdatesChildrenAndObservedGeneration(t *testing.T) {
	r, c := setup(t)
	reconcile(t, r)
	var greeting learningv1alpha1.Greeting
	if err := c.Get(testContext, testKey, &greeting); err != nil {
		t.Fatal(err)
	}
	greeting.Spec.Message, greeting.Spec.Replicas, greeting.Generation = "updated", 2, 4
	if err := c.Update(testContext, &greeting); err != nil {
		t.Fatal(err)
	}
	reconcile(t, r)
	var config corev1.ConfigMap
	if err := c.Get(testContext, types.NamespacedName{Namespace: testKey.Namespace, Name: "hello-content"}, &config); err != nil {
		t.Fatal(err)
	}
	var deployment appsv1.Deployment
	if err := c.Get(testContext, testKey, &deployment); err != nil {
		t.Fatal(err)
	}
	if config.Data["index.html"] != "updated" || *deployment.Spec.Replicas != 2 {
		t.Fatal("children do not match new desired inputs")
	}
	if err := c.Get(testContext, testKey, &greeting); err != nil {
		t.Fatal(err)
	}
	if greeting.Status.ObservedGeneration != 4 {
		t.Fatal("observed generation was not advanced")
	}
}

func TestForeignChildIsNotAdopted(t *testing.T) {
	foreign := &corev1.ConfigMap{ObjectMeta: metav1.ObjectMeta{Name: "hello-content", Namespace: testKey.Namespace}, Data: map[string]string{"index.html": "foreign-data"}}
	r, c := setup(t, foreign)
	_, err := r.Reconcile(testContext, ctrl.Request{NamespacedName: testKey})
	if !errors.Is(err, ErrOwnership) {
		t.Fatalf("expected ownership error, got %v", err)
	}
	var actual corev1.ConfigMap
	if err := c.Get(testContext, client.ObjectKeyFromObject(foreign), &actual); err != nil {
		t.Fatal(err)
	}
	if actual.Data["index.html"] != "foreign-data" || len(actual.OwnerReferences) != 0 {
		t.Fatal("foreign object was mutated")
	}
}

func TestReadinessRequiresTheCurrentDeploymentGeneration(t *testing.T) {
	r, c := setup(t)
	reconcile(t, r)
	var deployment appsv1.Deployment
	if err := c.Get(testContext, testKey, &deployment); err != nil {
		t.Fatal(err)
	}
	deployment.Generation = 7
	if err := c.Update(testContext, &deployment); err != nil {
		t.Fatal(err)
	}
	deployment.Status = appsv1.DeploymentStatus{ObservedGeneration: 6, Replicas: 1, UpdatedReplicas: 1, ReadyReplicas: 1, AvailableReplicas: 1}
	if err := c.Status().Update(testContext, &deployment); err != nil {
		t.Fatal(err)
	}
	if result := reconcile(t, r); result.RequeueAfter == 0 {
		t.Fatal("stale Deployment status was treated as current")
	}
	if err := c.Get(testContext, testKey, &deployment); err != nil {
		t.Fatal(err)
	}
	deployment.Status.ObservedGeneration = deployment.Generation
	if err := c.Status().Update(testContext, &deployment); err != nil {
		t.Fatal(err)
	}
	if result := reconcile(t, r); result.RequeueAfter != 0 {
		t.Fatal("fully converged deployment should not need timed polling")
	}
	var greeting learningv1alpha1.Greeting
	if err := c.Get(testContext, testKey, &greeting); err != nil {
		t.Fatal(err)
	}
	if !apimeta.IsStatusConditionTrue(greeting.Status.Conditions, "Ready") {
		t.Fatal("current available deployment should be ready")
	}
}

func TestPausePreservesExistingChildren(t *testing.T) {
	r, c := setup(t)
	reconcile(t, r)
	var greeting learningv1alpha1.Greeting
	if err := c.Get(testContext, testKey, &greeting); err != nil {
		t.Fatal(err)
	}
	greeting.Spec.Paused, greeting.Spec.Message = true, "must-not-be-applied"
	if err := c.Update(testContext, &greeting); err != nil {
		t.Fatal(err)
	}
	reconcile(t, r)
	var config corev1.ConfigMap
	if err := c.Get(testContext, types.NamespacedName{Namespace: testKey.Namespace, Name: "hello-content"}, &config); err != nil {
		t.Fatal(err)
	}
	if config.Data["index.html"] != "hello" {
		t.Fatal("paused reconciliation changed existing children")
	}
}

type conflictOnceClient struct {
	client.Client
	pending bool
}

func (c *conflictOnceClient) Update(ctx context.Context, obj client.Object, options ...client.UpdateOption) error {
	if _, ok := obj.(*corev1.ConfigMap); ok && c.pending {
		c.pending = false
		return apierrors.NewConflict(schema.GroupResource{Resource: "configmaps"}, obj.GetName(), errors.New("injected concurrent writer"))
	}
	return c.Client.Update(ctx, obj, options...)
}

func TestConflictIsReturnedAndFreshRetryConverges(t *testing.T) {
	r, c := setup(t)
	reconcile(t, r)
	var greeting learningv1alpha1.Greeting
	if err := c.Get(testContext, testKey, &greeting); err != nil {
		t.Fatal(err)
	}
	greeting.Spec.Message = "after-conflict"
	if err := c.Update(testContext, &greeting); err != nil {
		t.Fatal(err)
	}
	r.Client = &conflictOnceClient{Client: c, pending: true}
	if _, err := r.Reconcile(testContext, ctrl.Request{NamespacedName: testKey}); !apierrors.IsConflict(err) {
		t.Fatalf("expected returned conflict, got %v", err)
	}
	reconcile(t, r)
	var config corev1.ConfigMap
	if err := c.Get(testContext, types.NamespacedName{Namespace: testKey.Namespace, Name: "hello-content"}, &config); err != nil {
		t.Fatal(err)
	}
	if config.Data["index.html"] != "after-conflict" {
		t.Fatal("retry did not converge")
	}
}

func TestMissingPrimaryIsNormal(t *testing.T) {
	r, _ := setup(t)
	_, err := r.Reconcile(testContext, ctrl.Request{NamespacedName: types.NamespacedName{Namespace: testKey.Namespace, Name: "missing"}})
	if err != nil {
		t.Fatal(err)
	}
}

func TestMessageIsEscapedAsText(t *testing.T) {
	r, c := setup(t)
	var greeting learningv1alpha1.Greeting
	if err := c.Get(testContext, testKey, &greeting); err != nil {
		t.Fatal(err)
	}
	greeting.Spec.Message = "<script>alert('x')</script> & safe"
	if err := c.Update(testContext, &greeting); err != nil {
		t.Fatal(err)
	}
	reconcile(t, r)
	var config corev1.ConfigMap
	if err := c.Get(testContext, types.NamespacedName{Namespace: testKey.Namespace, Name: "hello-content"}, &config); err != nil {
		t.Fatal(err)
	}
	if config.Data["index.html"] != "&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt; &amp; safe" {
		t.Fatalf("message was not HTML-escaped: %s", config.Data["index.html"])
	}
}

func TestNamesIncompatibleWithServicesCreateNoChildren(t *testing.T) {
	for _, name := range []string{"hello.world", "123"} {
		t.Run(name, func(t *testing.T) {
			r, c := setup(t)
			greeting := &learningv1alpha1.Greeting{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: testKey.Namespace, UID: types.UID("invalid-" + name)}, Spec: learningv1alpha1.GreetingSpec{Message: "valid message", Replicas: 1}}
			if err := c.Create(testContext, greeting); err != nil {
				t.Fatal(err)
			}
			if _, err := r.Reconcile(testContext, ctrl.Request{NamespacedName: client.ObjectKeyFromObject(greeting)}); err != nil {
				t.Fatal(err)
			}
			if err := c.Get(testContext, client.ObjectKeyFromObject(greeting), greeting); err != nil {
				t.Fatal(err)
			}
			condition := apimeta.FindStatusCondition(greeting.Status.Conditions, "Ready")
			if condition == nil || condition.Reason != "InvalidSpec" {
				t.Fatal("incompatible Service name was not rejected")
			}
			for _, key := range []types.NamespacedName{{Namespace: testKey.Namespace, Name: name}, {Namespace: testKey.Namespace, Name: name + "-content"}} {
				for _, object := range []client.Object{&corev1.ConfigMap{}, &corev1.Service{}, &appsv1.Deployment{}} {
					if err := c.Get(testContext, key, object); !apierrors.IsNotFound(err) {
						t.Fatalf("invalid name created child %T: %v", object, err)
					}
				}
			}
		})
	}
}
