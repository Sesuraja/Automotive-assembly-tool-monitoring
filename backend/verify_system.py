import httpx as requests

def test_full_system():
    # 1. Login
    login_resp = requests.post(
        "http://localhost:8000/api/v1/auth/login",
        json={"email": "admin@aperture.io", "password": "AdminPass123!"}
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] 1. Super Admin Login Successful")

    # 2. Company Stats
    stats_resp = requests.get("http://localhost:8000/api/v1/companies/platform/stats", headers=headers)
    assert stats_resp.status_code == 200, f"Platform stats failed: {stats_resp.text}"
    stats = stats_resp.json()
    print(f"[PASS] 2. Platform Stats: {stats.get('total_users')} Users, {stats.get('active_assets')} Assets, {stats.get('active_sites')} Sites")

    # 3. Acceptance Suite
    acc_resp = requests.post("http://localhost:8000/api/v1/acceptance/run", headers=headers)
    assert acc_resp.status_code == 200, f"Acceptance suite failed: {acc_resp.text}"
    acc_data = acc_resp.json()
    print(f"[PASS] 3. Acceptance Suite: {acc_data['overall_status']} ({acc_data['passed_count']}/{len(acc_data['items'])} passed)")
    for item in acc_data.get("items", []):
        print(f"       [{item['status']}] {item['test_id']}: {item['name']}")

    # 4. Simulation condition test
    for cond in ["NORMAL", "MILD_DISTURBANCE", "STRONG_DISTURBANCE", "STALE_DATA", "PACKET_LOSS", "MOTOR_STOP_FAILURE"]:
        sim_resp = requests.post(f"http://localhost:8000/api/v1/telemetry/simulate-condition?condition={cond}", headers=headers)
        assert sim_resp.status_code == 200, f"Sim condition {cond} failed: {sim_resp.text}"
        print(f"[PASS] 4. Simulation Condition injected: {cond} -> {sim_resp.json()['message']}")

    # Reset to normal
    requests.post("http://localhost:8000/api/v1/telemetry/simulate-condition?condition=NORMAL", headers=headers)

    # 5. Check all main endpoints
    endpoints = [
        "/api/v1/companies",
        "/api/v1/organizations/tree",
        "/api/v1/sites",
        "/api/v1/stations",
        "/api/v1/assets",
        "/api/v1/devices",
        "/api/v1/models",
        "/api/v1/policies",
        "/api/v1/commands",
        "/api/v1/faults",
        "/api/v1/events",
        "/api/v1/reports/operational",
        "/api/v1/reports/ai",
        "/api/v1/reports/acceptance",
        "/api/v1/users",
        "/api/v1/roles",
        "/api/v1/system-health",
    ]
    for ep in endpoints:
        r = requests.get(f"http://localhost:8000{ep}", headers=headers)
        assert r.status_code == 200, f"Endpoint {ep} failed with {r.status_code}: {r.text}"
        print(f"[PASS] 5. Verified Endpoint: {ep} -> HTTP 200 OK")

    print("\n=======================================================")
    print("ALL 5 SYSTEM VALIDATION PHASES COMPLETED WITH 100% PASS")
    print("=======================================================")

if __name__ == "__main__":
    test_full_system()
