import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    
    req_data = None
    if data:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
        
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            err_data = json.loads(e.read().decode("utf-8"))
            detail = err_data.get("detail", str(e))
        except Exception:
            detail = str(e)
        return e.code, {"error": detail}
    except Exception as e:
        return 0, {"error": str(e)}

def verify():
    print("==================================================")
    print("        MONEY MANAGER LIVE API VERIFICATION       ")
    print("==================================================")

    # 1. Health Check
    print("\n[1/7] Checking API Health Status...")
    status, res = make_request(f"{BASE_URL}/")
    if status == 200 and res.get("status") == "healthy":
        print(f"  [OK] Health Status: OK ({res.get('service')})")
    else:
        print(f"  [FAIL] Health Status: FAILED (Status: {status}, Error: {res})")
        sys.exit(1)

    # 2. Login Check for User A (Alex) and User B (Taylor)
    print("\n[2/7] Checking JWT Authentication for Alex & Taylor (POST /auth/login)...")
    alex_payload = {"email": "demo@example.com", "password": "password123"}
    status_a, res_a = make_request(f"{BASE_URL}/auth/login", method="POST", data=alex_payload)
    
    taylor_payload = {"email": "partner@example.com", "password": "password123"}
    status_b, res_b = make_request(f"{BASE_URL}/auth/login", method="POST", data=taylor_payload)

    if status_a == 200 and "access_token" in res_a and status_b == 200 and "access_token" in res_b:
        alex_token = res_a["access_token"]
        taylor_token = res_b["access_token"]
        print("  [OK] Auth Status: SUCCESS (Tokens successfully issued for both users)")
    else:
        print(f"  [FAIL] Auth Status: FAILED (Alex Status: {status_a}, Taylor Status: {status_b})")
        sys.exit(1)

    alex_headers = {"Authorization": f"Bearer {alex_token}"}
    taylor_headers = {"Authorization": f"Bearer {taylor_token}"}

    # 3. User Profile context check
    print("\n[3/7] Fetching User contexts (GET /users/me)...")
    status_a, alex_profile = make_request(f"{BASE_URL}/users/me", headers=alex_headers)
    status_b, taylor_profile = make_request(f"{BASE_URL}/users/me", headers=taylor_headers)

    if status_a == 200 and status_b == 200:
        alex_id = alex_profile["id"]
        taylor_id = taylor_profile["id"]
        print(f"  [OK] Profile A: {alex_profile['name']} (ID: {alex_id})")
        print(f"  [OK] Profile B: {taylor_profile['name']} (ID: {taylor_id})")
    else:
        print("  [FAIL] Fetching profile contexts failed.")
        sys.exit(1)

    # 4. Connected Partners Check
    print("\n[4/7] Checking Partners connection status (GET /partners)...")
    status, partners_res = make_request(f"{BASE_URL}/partners", headers=alex_headers)
    if status == 200 and isinstance(partners_res, list):
        taylor_connected = any(p["id"] == taylor_id for p in partners_res)
        if taylor_connected:
            print(f"  [OK] Partners Status: SUCCESS (Taylor is connected to Alex)")
        else:
            print("  [FAIL] Taylor is not connected to Alex.")
            sys.exit(1)
    else:
        print(f"  [FAIL] Partners Status: FAILED (Status: {status}, Error: {partners_res})")
        sys.exit(1)

    # 5. Shared Transaction Privacy Checks
    print("\n[5/7] Verifying Shared Transaction Privacy Filters (GET /partners/{partner_id}/transactions)...")
    
    # 5a. Alex queries Taylor's shared transactions
    status, alex_view_taylor_txs = make_request(f"{BASE_URL}/partners/{taylor_id}/transactions", headers=alex_headers)
    if status == 200 and isinstance(alex_view_taylor_txs, list):
        print(f"  [OK] Alex successfully queried Taylor's transactions (Found: {len(alex_view_taylor_txs)})")
        
        # Verify that private transactions are NOT present
        private_txs = [t for t in alex_view_taylor_txs if t.get("is_private") is True or "Hidden" in t.get("title", "")]
        if not private_txs:
            print("  [OK] Security Assertion Passed: No private transactions leaked to Alex!")
        else:
            print(f"  [FAIL] Security Leak: Found private transactions in shared feed: {private_txs}")
            sys.exit(1)
    else:
        print(f"  [FAIL] Alex viewing Taylor's transactions failed: {status} -> {alex_view_taylor_txs}")
        sys.exit(1)

    # 5b. Taylor queries Alex's shared transactions
    status, taylor_view_alex_txs = make_request(f"{BASE_URL}/partners/{alex_id}/transactions", headers=taylor_headers)
    if status == 200 and isinstance(taylor_view_alex_txs, list):
        print(f"  [OK] Taylor successfully queried Alex's transactions (Found: {len(taylor_view_alex_txs)})")
        
        # Verify that private transactions are NOT present
        private_txs = [t for t in taylor_view_alex_txs if t.get("is_private") is True or "Hidden" in t.get("title", "")]
        if not private_txs:
            print("  [OK] Security Assertion Passed: No private transactions leaked to Taylor!")
        else:
            print(f"  [FAIL] Security Leak: Found private transactions in shared feed: {private_txs}")
            sys.exit(1)
    else:
        print(f"  [FAIL] Taylor viewing Alex's transactions failed: {status} -> {taylor_view_alex_txs}")
        sys.exit(1)

    # 6. Symmetrical / Granular Sharing Controls Verification
    print("\n[6/7] Testing Granular Sharing Toggles (PUT /partners/sharing-settings/{account_id})...")
    
    # 6a. Get Alex's shared accounts as Taylor first
    status, shared_accs_pre = make_request(f"{BASE_URL}/partners/{alex_id}/accounts", headers=taylor_headers)
    if status != 200 or not isinstance(shared_accs_pre, list) or len(shared_accs_pre) == 0:
        print("  [FAIL] Could not fetch shared accounts initially.")
        sys.exit(1)
        
    target_account = shared_accs_pre[0]
    target_account_id = target_account["id"]
    print(f"  [INFO] Target Account chosen for unsharing: {target_account['name']} (ID: {target_account_id})")

    # 6b. Alex toggles sharing for this account to False
    toggle_payload = {"partner_id": taylor_id, "is_shared": False}
    status, toggle_res = make_request(
        f"{BASE_URL}/partners/sharing-settings/{target_account_id}", 
        method="PUT", 
        data=toggle_payload, 
        headers=alex_headers
    )
    if status == 200 and toggle_res.get("is_shared") is False:
        print(f"  [OK] Alex successfully unshared account: {target_account['name']}")
    else:
        print(f"  [FAIL] Toggle sharing failed: {status} -> {toggle_res}")
        sys.exit(1)

    # 6c. Taylor queries Alex's shared accounts again. Target account must not be present.
    status, shared_accs_post = make_request(f"{BASE_URL}/partners/{alex_id}/accounts", headers=taylor_headers)
    if status == 200:
        found = any(a["id"] == target_account_id for a in shared_accs_post)
        if not found:
            print("  [OK] Security Assertion Passed: Taylor can no longer see the unshared account!")
        else:
            print("  [FAIL] Security Leak: Taylor can still see the unshared account.")
            sys.exit(1)
    else:
        print(f"  [FAIL] Fetching shared accounts post-toggle failed: {status}")
        sys.exit(1)

    # 6d. Taylor queries Alex's shared transactions again. Transactions from the unshared account must not be present.
    status, shared_txs_post = make_request(f"{BASE_URL}/partners/{alex_id}/transactions", headers=taylor_headers)
    if status == 200:
        leaked_txs = [t for t in shared_txs_post if t.get("account_id") == target_account_id]
        if not leaked_txs:
            print("  [OK] Security Assertion Passed: Taylor can no longer see transactions from the unshared account!")
        else:
            print(f"  [FAIL] Security Leak: Taylor can still see transactions from the unshared account: {leaked_txs}")
            sys.exit(1)
    else:
        print(f"  [FAIL] Fetching shared transactions post-toggle failed: {status}")
        sys.exit(1)

    # 6e. Restore sharing so database returns to normal
    restore_payload = {"partner_id": taylor_id, "is_shared": True}
    status, toggle_res = make_request(
        f"{BASE_URL}/partners/sharing-settings/{target_account_id}", 
        method="PUT", 
        data=restore_payload, 
        headers=alex_headers
    )
    if status == 200 and toggle_res.get("is_shared") is True:
        print("  [OK] Restored account sharing to default state.")
    else:
        print("  [FAIL] Restoring account sharing failed.")
        sys.exit(1)

    # 7. In-flight transaction privacy toggling verification (PATCH /transactions/{tx_id}/privacy)
    print("\n[7/7] Testing Transaction Privacy Toggling (PATCH /transactions/{tx_id}/privacy)...")
    
    # 7a. Alex queries his own transactions to pick a target
    status, alex_txs = make_request(f"{BASE_URL}/transactions", headers=alex_headers)
    if status != 200 or not isinstance(alex_txs, list) or len(alex_txs) == 0:
        print("  [FAIL] Could not query Alex's own transactions.")
        sys.exit(1)
        
    # Pick a public transaction
    public_tx = [t for t in alex_txs if t.get("is_private") is False and t.get("account_id") == target_account_id][0]
    public_tx_id = public_tx["id"]
    print(f"  [INFO] Chosen public transaction: '{public_tx['title']}' (ID: {public_tx_id})")

    # Verify Taylor can see it first
    status, taylor_view_pre = make_request(f"{BASE_URL}/partners/{alex_id}/transactions", headers=taylor_headers)
    if status == 200:
        found = any(t["id"] == public_tx_id for t in taylor_view_pre)
        if not found:
            print("  [FAIL] Taylor could not see the public transaction initially (pre-toggle).")
            sys.exit(1)
    else:
        print(f"  [FAIL] Taylor initial query failed: {status}")
        sys.exit(1)

    # 7b. Alex toggles the privacy of the target transaction
    status, patch_res = make_request(f"{BASE_URL}/transactions/{public_tx_id}/privacy", method="PATCH", headers=alex_headers)
    if status == 200 and patch_res.get("is_private") is True:
        print("  [OK] Alex successfully marked transaction private")
    else:
        print(f"  [FAIL] Patch privacy failed: {status} -> {patch_res}")
        sys.exit(1)

    # 7c. Taylor queries Alex's transactions again. The private transaction must be gone!
    status, taylor_view_post = make_request(f"{BASE_URL}/partners/{alex_id}/transactions", headers=taylor_headers)
    if status == 200:
        found = any(t["id"] == public_tx_id for t in taylor_view_post)
        if not found:
            print("  [OK] Security Assertion Passed: Transaction is now hidden from Taylor's feed!")
        else:
            print("  [FAIL] Security Leak: Taylor can still see the transaction after it was marked private.")
            sys.exit(1)
    else:
        print(f"  [FAIL] Taylor post-toggle query failed: {status}")
        sys.exit(1)

    # 7d. Restore privacy to false
    status, patch_res = make_request(f"{BASE_URL}/transactions/{public_tx_id}/privacy", method="PATCH", headers=alex_headers)
    if status == 200 and patch_res.get("is_private") is False:
        print("  [OK] Restored transaction privacy to public.")
    else:
        print("  [FAIL] Restoring transaction privacy failed.")
        sys.exit(1)

    print("\n==================================================")
    print("      ALL ENDPOINTS VERIFIED AND RESPONDING OK    ")
    print("==================================================")

if __name__ == "__main__":
    verify()
