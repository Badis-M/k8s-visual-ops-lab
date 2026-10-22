import unittest

from server import response_for


class FailureSemanticsTests(unittest.TestCase):
    def test_dependency_failure_does_not_fail_liveness(self):
        self.assertEqual(response_for("/live", False)[0], 200)
        self.assertEqual(response_for("/ready", False)[0], 503)
        self.assertEqual(response_for("/", False)[0], 503)

    def test_recovery_restores_readiness_and_requests(self):
        for path in ("/live", "/ready", "/"):
            self.assertEqual(response_for(path, True)[0], 200)

    def test_unknown_path_is_not_a_health_success(self):
        self.assertEqual(response_for("/unknown", True)[0], 404)


if __name__ == "__main__":
    unittest.main()
