import copy
import unittest

from server import GROUP, convert_object, convert_review


class ConversionTests(unittest.TestCase):
    def obj(self, name="demo", version="v1", count=3):
        return {
            "apiVersion": f"{GROUP}/{version}",
            "kind": "Gadget",
            "metadata": {"name": name, "namespace": "lab-conversion", "uid": name + "-uid", "resourceVersion": "12", "annotations": {"keep": "yes"}},
            "spec": {"size" if version == "v1" else "replicas": count},
            "status": {"observedReplicas": 2},
        }

    def review(self, objects, desired="v2"):
        return {"apiVersion": "apiextensions.k8s.io/v1", "kind": "ConversionReview", "request": {"uid": "review-uid", "desiredAPIVersion": f"{GROUP}/{desired}", "objects": objects}}

    def test_roundtrip_preserves_complete_object(self):
        original = self.obj()
        upgraded = convert_object(original, f"{GROUP}/v2")
        self.assertEqual(upgraded["spec"], {"replicas": 3})
        self.assertEqual(convert_object(upgraded, f"{GROUP}/v1"), original)

    def test_input_is_not_mutated(self):
        original = self.obj()
        before = copy.deepcopy(original)
        convert_object(original, f"{GROUP}/v2")
        self.assertEqual(original, before)

    def test_batch_uid_order_identity_and_status(self):
        objects = [self.obj("one"), self.obj("two", "v2", 4)]
        response = convert_review(self.review(objects))["response"]
        self.assertEqual(response["uid"], "review-uid")
        self.assertEqual(response["result"]["status"], "Success")
        self.assertEqual([item["metadata"] for item in response["convertedObjects"]], [item["metadata"] for item in objects])
        self.assertEqual([item["status"] for item in response["convertedObjects"]], [item["status"] for item in objects])

    def test_identity_conversion_is_a_copy(self):
        original = self.obj()
        converted = convert_object(original, f"{GROUP}/v1")
        self.assertEqual(converted, original)
        self.assertIsNot(converted, original)

    def test_unsupported_version_fails_without_partial_objects(self):
        review = self.review([self.obj()])
        review["request"]["desiredAPIVersion"] = f"{GROUP}/v9"
        response = convert_review(review)["response"]
        self.assertEqual(response["result"]["status"], "Failure")
        self.assertNotIn("convertedObjects", response)

    def test_invalid_count_fails(self):
        for count in (True, 0, 11, "3"):
            self.assertEqual(convert_review(self.review([self.obj(count=count)]))["response"]["result"]["status"], "Failure")

    def test_malformed_review_rejected(self):
        with self.assertRaises(ValueError):
            convert_review({})


if __name__ == "__main__":
    unittest.main()
