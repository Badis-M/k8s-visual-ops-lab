GO ?= go
CONTROLLER_GEN_VERSION := v0.20.0

.PHONY: generate test build
generate:
	$(GO) run sigs.k8s.io/controller-tools/cmd/controller-gen@$(CONTROLLER_GEN_VERSION) object paths="./api/..." crd output:crd:dir=../../crds
	mv ../../crds/learning.k8svisual.dev_greetings.yaml ../../crds/greetings.yaml

test:
	$(GO) test -p 2 ./...

build:
	$(GO) build -o bin/manager ./cmd
