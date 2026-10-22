import unittest
from render import render


class WorkloadContract(unittest.TestCase):
    def test_rejects_names_that_could_escape_a_contract(self):
        for name in ["../other", "x;echo", "Uppercase", "123-notes", "", "x" * 64]:
            with self.subTest(name=name), self.assertRaises(ValueError):
                render(name, "learning", "small", "dev")

    def test_restricts_environment_tier_and_namespace(self):
        for tier, environment, namespace in [("enormous", "dev", "lab-platform"), ("small", "live", "lab-platform"), ("small", "dev", "kube-system")]:
            with self.subTest(tier=tier, environment=environment, namespace=namespace), self.assertRaises(ValueError):
                render("notes", "learning", tier, environment, namespace)

    def test_golden_path_keeps_selectors_and_ports_consistent(self):
        objects = render("notes", "learning", "small", "prod")["items"]
        deployment, service = objects[2:]
        self.assertEqual(deployment["spec"]["replicas"], 2)
        self.assertEqual(service["spec"]["selector"], deployment["spec"]["selector"]["matchLabels"])
        container = deployment["spec"]["template"]["spec"]["containers"][0]
        self.assertEqual(service["spec"]["ports"][0]["targetPort"], container["ports"][0]["name"])
        self.assertFalse(container["securityContext"]["allowPrivilegeEscalation"])
        self.assertFalse(deployment["spec"]["template"]["spec"]["automountServiceAccountToken"])
        self.assertNotIn("LoadBalancer", str(service))


if __name__ == "__main__":
    unittest.main()
