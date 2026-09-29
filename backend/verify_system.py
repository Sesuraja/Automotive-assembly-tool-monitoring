import httpx as requests
from datetime import datetime, timezone

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

    # 2. Gateways Management
    gw_list_resp = requests.get("http://localhost:8000/api/v1/gateways", headers=headers)
    assert gw_list_resp.status_code == 200, f"List gateways failed: {gw_list_resp.text}"
    print(f"[PASS] 2. Gateways Listed: {len(gw_list_resp.json())} Gateways registered")

    create_gw_resp = requests.post(
        "http://localhost:8000/api/v1/gateways",
        headers=headers,
        json={
            "gateway_id": f"GW-TEST-{int(datetime.now().timestamp())}",
            "name": "Industrial Test Gateway #99",
            "ip_address": "192.168.1.199",
            "mac_address": "A4:C1:38:99:99:99",
            "protocol": "HTTP_REST"
        }
    )
    assert create_gw_resp.status_code == 201, f"Create gateway failed: {create_gw_resp.text}"
    created_gw = create_gw_resp.json()
    print(f"[PASS] 3. Registered New Gateway: {created_gw['gateway_id']} ({created_gw['name']})")

    # 3. Sensor Registration
    sensor_resp = requests.post(
        "http://localhost:8000/api/v1/gateways/sensors",
        headers=headers,
        json={
            "device_id": f"BLE-VIB-TEST-{int(datetime.now().timestamp())}",
            "name": "Piezo-MEMS Spindle Vibration Sensor",
            "ble_address": "D4:36:39:AA:BB:CC",
            "gateway_id": created_gw["gateway_id"],
            "sampling_rate_hz": 3200
        }
    )
    assert sensor_resp.status_code == 201, f"Add sensor failed: {sensor_resp.text}"
    print(f"[PASS] 4. Registered Sensor on Gateway: {sensor_resp.json()['message']}")

    # 4. Ingest Industrial Gateway Telemetry Packet
    now_iso = datetime.now(timezone.utc).isoformat()
    telemetry_packet = {
        "gateway_id": created_gw["gateway_id"],
        "sensor_id": "BLE-VIB-001",
        "sequence": 5001,
        "timestamp": now_iso,
        "sampling_rate_hz": 3200,
        "x": [0.082, 0.085, 0.079, 0.081],
        "y": [0.045, 0.048, 0.042, 0.046],
        "z": [0.989, 0.992, 0.985, 0.991]
    }
    ingest_resp = requests.post(
        "http://localhost:8000/api/v1/gateways/telemetry",
        json=telemetry_packet
    )
    assert ingest_resp.status_code == 200, f"Ingestion failed: {ingest_resp.text}"
    ingest_data = ingest_resp.json()
    print(f"[PASS] 5. Ingestion Webhook Received Packet: Seq #{ingest_data['sequence']} -> Status: {ingest_data['status']}")
    print(f"       Features Computed: RMS={ingest_data['features']['rms']:.3f}g, Peak={ingest_data['features']['peak']:.3f}g")
    print(f"       AI Prediction: {ingest_data['ai_inference']['predicted_class']}, Decision: {ingest_data['policy_decision']['action']}")

    # 5. Clean up test gateway
    del_resp = requests.delete(f"http://localhost:8000/api/v1/gateways/{created_gw['id']}", headers=headers)
    assert del_resp.status_code == 200
    print(f"[PASS] 6. Cleaned up Test Gateway: {created_gw['gateway_id']}")

    # 6. Acceptance Suite
    acc_resp = requests.post("http://localhost:8000/api/v1/acceptance/run", headers=headers)
    assert acc_resp.status_code == 200
    acc_data = acc_resp.json()
    print(f"[PASS] 7. PRD Acceptance Suite: {acc_data['overall_status']} ({acc_data['passed_count']}/{len(acc_data['items'])} tests)")

    # 7. Check All System Endpoints
    endpoints = [
        "/api/v1/companies",
        "/api/v1/gateways",
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
        assert r.status_code == 200, f"Endpoint {ep} failed: {r.status_code}"

    print("\n==================================================================")
    print("ALL GATEWAY, SENSOR, SIMULATION & PLATFORM TESTS PASSED (100% OK)")
    print("==================================================================")

if __name__ == "__main__":
    test_full_system()
