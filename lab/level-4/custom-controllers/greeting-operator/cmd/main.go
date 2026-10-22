package main

import (
	"flag"
	"fmt"
	"os"

	learningv1alpha1 "example.com/k8s-visual-ops-lab/greeting-operator/api/v1alpha1"
	"example.com/k8s-visual-ops-lab/greeting-operator/internal/controller"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/cache"
	"sigs.k8s.io/controller-runtime/pkg/healthz"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"
	metricsserver "sigs.k8s.io/controller-runtime/pkg/metrics/server"
)

func run() error {
	var contextName, namespace string
	flag.StringVar(&contextName, "context", "", "Explicit kubeconfig context; empty requires in-cluster credentials")
	flag.StringVar(&namespace, "namespace", "lab-operator", "Single watched namespace")
	logOptions := zap.Options{}
	logOptions.BindFlags(flag.CommandLine)
	flag.Parse()
	ctrl.SetLogger(zap.New(zap.UseFlagOptions(&logOptions)))
	if namespace == "" {
		return fmt.Errorf("namespace must not be empty")
	}

	var config *rest.Config
	var err error
	if contextName == "" {
		config, err = rest.InClusterConfig()
	} else {
		config, err = clientcmd.NewNonInteractiveDeferredLoadingClientConfig(clientcmd.NewDefaultClientConfigLoadingRules(), &clientcmd.ConfigOverrides{CurrentContext: contextName}).ClientConfig()
	}
	if err != nil {
		return fmt.Errorf("load explicit cluster configuration: %w", err)
	}
	scheme := runtime.NewScheme()
	for _, add := range []func(*runtime.Scheme) error{corev1.AddToScheme, appsv1.AddToScheme, learningv1alpha1.AddToScheme} {
		if err := add(scheme); err != nil {
			return fmt.Errorf("register API: %w", err)
		}
	}
	manager, err := ctrl.NewManager(config, ctrl.Options{
		Scheme:                  scheme,
		Cache:                   cache.Options{DefaultNamespaces: map[string]cache.Config{namespace: {}}},
		Metrics:                 metricsserver.Options{BindAddress: "0"},
		HealthProbeBindAddress:  ":8081",
		LeaderElection:          true,
		LeaderElectionID:        "greeting-controller.learning.k8svisual.dev",
		LeaderElectionNamespace: namespace,
	})
	if err != nil {
		return fmt.Errorf("create manager: %w", err)
	}
	if err := (&controller.GreetingReconciler{Client: manager.GetClient(), Scheme: scheme}).SetupWithManager(manager); err != nil {
		return fmt.Errorf("register controller: %w", err)
	}
	if err := manager.AddHealthzCheck("health", healthz.Ping); err != nil {
		return err
	}
	if err := manager.AddReadyzCheck("ready", healthz.Ping); err != nil {
		return err
	}
	return manager.Start(ctrl.SetupSignalHandler())
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "manager failed: %v\n", err)
		os.Exit(1)
	}
}
