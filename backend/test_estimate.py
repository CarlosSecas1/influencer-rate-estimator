import unittest

from app import app


class EstimateEndpointTest(unittest.TestCase):
    def test_estimate_returns_payment_range(self):
        client = app.test_client()

        response = client.post(
            "/estimate",
            json={
                "platform": "instagram",
                "followerCount": 25000,
                "averageViews": 1500,
                "videoCount": 1,
                "usageRights": False,
                "exclusivity": False,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json(),
            {
                "estimatedViews": 1500,
                "estimatedLow": 150,
                "estimatedHigh": 300,
                "viewsSource": "averageViews",
                "explanation": [
                    "Estimate uses the average views per video you provided.",
                    "Estimate includes 1 promotional video(s).",
                    "No usage rights adjustment applied.",
                    "No exclusivity adjustment applied.",
                ],
            },
        )

    def test_estimate_applies_usage_rights_and_exclusivity(self):
        client = app.test_client()

        response = client.post(
            "/estimate",
            json={
                "followerCount": 10000,
                "averageViews": 800,
                "videoCount": 2,
                "usageRights": True,
                "exclusivity": True,
            },
        )

        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["estimatedViews"], 800)
        self.assertEqual(data["estimatedLow"], 270)
        self.assertEqual(data["estimatedHigh"], 540)

    def test_estimate_falls_back_to_follower_count(self):
        client = app.test_client()

        response = client.post(
            "/estimate",
            json={
                "followerCount": 25000,
                "videoCount": 1,
                "usageRights": False,
                "exclusivity": False,
            },
        )

        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["estimatedViews"], 2500)
        self.assertEqual(data["estimatedLow"], 250)
        self.assertEqual(data["estimatedHigh"], 500)
        self.assertEqual(data["viewsSource"], "followerCount")

    def test_estimate_requires_follower_count(self):
        client = app.test_client()

        response = client.post("/estimate", json={"averageViews": 1500})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.get_json(),
            {"error": "followerCount must be a positive whole number."},
        )


if __name__ == "__main__":
    unittest.main()
