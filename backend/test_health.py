import unittest

from app import app


class HealthEndpointTest(unittest.TestCase):
    def test_health_returns_ok(self):
        client = app.test_client()

        response = client.get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"status": "ok"})


if __name__ == "__main__":
    unittest.main()
