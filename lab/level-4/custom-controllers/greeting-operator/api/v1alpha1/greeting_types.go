package v1alpha1

import metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

type GreetingSpec struct {
	// +kubebuilder:validation:MinLength=1
	// +kubebuilder:validation:MaxLength=200
	Message string `json:"message"`

	// +kubebuilder:default=1
	// +kubebuilder:validation:Minimum=1
	// +kubebuilder:validation:Maximum=3
	// +optional
	Replicas int32 `json:"replicas,omitempty"`

	// +kubebuilder:default=false
	// +optional
	Paused bool `json:"paused,omitempty"`
}

type GreetingStatus struct {
	// +optional
	ObservedGeneration int64 `json:"observedGeneration,omitempty"`
	// +optional
	ReadyReplicas int32 `json:"readyReplicas,omitempty"`
	// +listType=map
	// +listMapKey=type
	// +optional
	Conditions []metav1.Condition `json:"conditions,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:validation:XValidation:rule="size(self.metadata.name) <= 50",message="name must contain at most 50 characters for child labels"
// +kubebuilder:validation:XValidation:rule="self.metadata.name.matches('^[a-z]([-a-z0-9]*[a-z0-9])?$')",message="name must be a DNS-1035 label for its child Service"
// +kubebuilder:printcolumn:name="Message",type=string,JSONPath=`.spec.message`
// +kubebuilder:printcolumn:name="Observed",type=integer,JSONPath=`.status.observedGeneration`
type Greeting struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`
	Spec              GreetingSpec `json:"spec"`
	// +optional
	Status GreetingStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true
type GreetingList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Greeting `json:"items"`
}

func init() { SchemeBuilder.Register(&Greeting{}, &GreetingList{}) }
