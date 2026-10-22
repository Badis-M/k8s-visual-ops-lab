import type { DiagramName } from "@/content/types";
import { ArchitectureDiagram } from "./ArchitectureDiagram";
import { ReconcileDiagram } from "./ReconcileDiagram";
import { DeploymentTreeDiagram, PodLifecycleDiagram, VmVsContainerDiagram } from "./SmallDiagrams";

export function Diagram({ name }: { name: DiagramName }) {
  switch (name) {
    case "architecture":
      return <ArchitectureDiagram />;
    case "reconcile":
      return <ReconcileDiagram />;
    case "deployment-tree":
      return <DeploymentTreeDiagram />;
    case "vm-vs-container":
      return <VmVsContainerDiagram />;
    case "pod-lifecycle":
      return <PodLifecycleDiagram />;
  }
}
