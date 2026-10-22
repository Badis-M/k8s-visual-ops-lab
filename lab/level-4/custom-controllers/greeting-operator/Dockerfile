FROM golang:1.25.14 AS build
WORKDIR /workspace
COPY go.mod go.sum ./
RUN go mod download
COPY api/ api/
COPY internal/ internal/
COPY cmd/ cmd/
RUN CGO_ENABLED=0 go build -trimpath -o /manager ./cmd

FROM scratch
COPY --from=build /manager /manager
USER 65532:65532
ENTRYPOINT ["/manager"]
