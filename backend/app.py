from flask import Flask, jsonify, request

app = Flask(__name__)


@app.get("/health")
def health():
    return jsonify({"status": "ok"}), 200


def bad_request(message):
    return jsonify({"error": message}), 400


def is_number(value):
    return not isinstance(value, bool) and isinstance(value, (int, float))


def is_positive_whole_number(value):
    return not isinstance(value, bool) and isinstance(value, int) and value > 0


@app.post("/estimate")
def estimate():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return bad_request("Request body must be a JSON object.")

    follower_count = data.get("followerCount")
    if not is_positive_whole_number(follower_count):
        return bad_request("followerCount must be a positive whole number.")

    average_views = data.get("averageViews")
    if average_views is not None and not is_number(average_views):
        return bad_request("averageViews must be a number when provided.")

    if average_views is not None and average_views <= 0:
        return bad_request("averageViews must be greater than zero when provided.")

    video_count = data.get("videoCount", 1)
    if not is_positive_whole_number(video_count):
        return bad_request("videoCount must be a positive whole number.")

    if average_views is None:
        estimated_views = round(follower_count * 0.10)
        views_source = "followerCount"
    else:
        estimated_views = round(average_views)
        views_source = "averageViews"

    estimated_low = estimated_views * 0.10 * video_count
    estimated_high = estimated_views * 0.20 * video_count

    explanation = [
        (
            "Estimate uses the average views per video you provided."
            if views_source == "averageViews"
            else (
                "Average views were estimated as 10% of follower count because "
                "average views were not provided."
            )
        ),
        f"Estimate includes {video_count} promotional video(s).",
    ]

    if data.get("usageRights"):
        estimated_low *= 1.25
        estimated_high *= 1.25
        explanation.append(
            "Usage rights add 25% because the restaurant can reuse the content."
        )
    else:
        explanation.append("No usage rights adjustment applied.")

    if data.get("exclusivity"):
        estimated_low *= 1.35
        estimated_high *= 1.35
        explanation.append(
            "Exclusivity adds 35% because it limits other restaurant partnerships."
        )
    else:
        explanation.append("No exclusivity adjustment applied.")

    return jsonify(
        {
            "estimatedViews": estimated_views,
            "estimatedLow": round(estimated_low),
            "estimatedHigh": round(estimated_high),
            "explanation": explanation,
            "viewsSource": views_source,
        }
    ), 200


if __name__ == "__main__":
    app.run(debug=True)
