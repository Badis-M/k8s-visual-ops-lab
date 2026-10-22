import copy
import unittest

from server import admit


class AdmissionTests(unittest.TestCase):
    def review(self, labels=None, dry_run=False):
        return {
            "apiVersion": "admission.k8s.io/v1",
            "kind": "AdmissionReview",
            "request": {
                "uid": "test-uid",
                "operation": "CREATE",
                "resource": {"group": "", "version": "v1", "resource": "configmaps"},
                "dryRun": dry_run,
                "object": {"metadata": {"name": "demo", "labels": labels or {}}},
            },
        }

    def test_allowed_preserves_uid_without_mutating_input(self):
        review = self.review({"lab.k8sops.dev/owner": "platform"})
        original = copy.deepcopy(review)
        self.assertEqual(admit(review)["response"], {"uid": "test-uid", "allowed": True})
        self.assertEqual(review, original)

    def test_missing_owner_denied_with_reason(self):
        response = admit(self.review())["response"]
        self.assertFalse(response["allowed"])
        self.assertEqual(response["status"]["code"], 422)

    def test_whitespace_owner_denied(self):
        self.assertFalse(admit(self.review({"lab.k8sops.dev/owner": "  "}))["response"]["allowed"])

    def test_dry_run_has_identical_decision_and_no_side_effects(self):
        self.assertEqual(admit(self.review()), admit(self.review(dry_run=True)))

    def test_update_is_validated(self):
        review = self.review()
        review["request"]["operation"] = "UPDATE"
        self.assertFalse(admit(review)["response"]["allowed"])

    def test_malformed_envelope_fails(self):
        for review in ({}, {"apiVersion": "admission.k8s.io/v1", "request": {}}):
            with self.assertRaises(ValueError):
                admit(review)

    def test_unexpected_resource_fails(self):
        review = self.review()
        review["request"]["resource"]["resource"] = "secrets"
        with self.assertRaises(ValueError):
            admit(review)


if __name__ == "__main__":
    unittest.main()
