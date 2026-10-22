import copy
import unittest

from select_sandbox import select_sandbox


class SandboxSelectionTests(unittest.TestCase):
    def item(self, sandbox_id="a123", uid="current-uid", state="SANDBOX_READY"):
        return {"id": sandbox_id, "state": state, "metadata": {"uid": uid, "namespace": "lab-cri", "name": "runtime-demo", "attempt": 1}}

    def test_selects_current_ready_uid_and_ignores_stale_attempts(self):
        document = {"items": [self.item("b456", uid="old-uid"), self.item("c789", state="SANDBOX_NOTREADY"), self.item()]}
        before = copy.deepcopy(document)
        self.assertEqual(select_sandbox(document, "current-uid"), "a123")
        self.assertEqual(document, before)

    def test_multiple_ready_matches_are_refused(self):
        with self.assertRaisesRegex(ValueError, "found 2"):
            select_sandbox({"items": [self.item(), self.item("d123")]}, "current-uid")

    def test_old_uid_is_refused_even_when_name_matches(self):
        with self.assertRaisesRegex(ValueError, "found 0"):
            select_sandbox({"items": [self.item(uid="old-uid")]}, "current-uid")

    def test_notready_and_unrecognized_state_are_refused(self):
        for state in ("SANDBOX_NOTREADY", "Ready", 0, None):
            with self.assertRaisesRegex(ValueError, "found 0"):
                select_sandbox({"items": [self.item(state=state)]}, "current-uid")

    def test_namespace_and_name_must_match_exactly(self):
        for field, value in (("namespace", "lab-cri-extra"), ("name", "runtime-demo-other")):
            item = self.item()
            item["metadata"][field] = value
            with self.assertRaisesRegex(ValueError, "found 0"):
                select_sandbox({"items": [item]}, "current-uid")

    def test_missing_uid_and_malformed_envelope_are_refused(self):
        for document, uid in (({"items": []}, ""), ({}, "current-uid")):
            with self.assertRaises(ValueError):
                select_sandbox(document, uid)


if __name__ == "__main__":
    unittest.main()
