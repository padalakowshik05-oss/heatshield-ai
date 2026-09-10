from services.thermal_service import get_risk_category


test_scores = [
    10,
    24,
    25,
    40,
    49,
    50,
    60,
    74,
    75,
    90,
    100
]


for score in test_scores:

    category = get_risk_category(score)

    print(
        "Score:",
        score,
        "→",
        category
    )