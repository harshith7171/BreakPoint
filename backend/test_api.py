import json
from models import GraphState, RecoveryStrategy
from simulator import run_cascade_simulation, run_recovery_simulation
from main import DEFAULT_SCENARIOS

def test_simulation():
    scenario = DEFAULT_SCENARIOS["ecommerce"]
    graph = GraphState(nodes=scenario["nodes"], edges=scenario["edges"])
    
    # Test 1: Fail payment_api (Stripe)
    # Order service depends on payment_api (hard)
    # API Gateway depends on Order service (hard)
    # CDN depends on API Gateway (hard)
    # Client depends on CDN (hard)
    # Recommendation service is soft from Gateway
    res = run_cascade_simulation(graph, "payment_api")
    print("--- Test 1: Fail payment_api ---")
    print(f"Summary: {res.summary}")
    print(f"Blast Radius: {res.blast_radius_percentage}%")
    print(f"Waves: {len(res.waves)}")
    for w in res.waves:
        print(f"  Step {w.step}: {w.node_label} -> {w.status} ({w.reason})")
    
    assert res.blast_radius_percentage > 0
    assert any(w.node_id == "order_svc" and w.status == "CASCADED" for w in res.waves)
    assert any(w.node_id == "api_gateway" and w.status == "CASCADED" for w in res.waves)

    # Test 2: Recovery with FAILOVER (payment_api has backup_payment)
    rec_failover = run_recovery_simulation(graph, "payment_api", RecoveryStrategy.FAILOVER)
    print("\n--- Test 2: Failover Recovery ---")
    print(f"Success: {rec_failover.success}")
    print(f"Message: {rec_failover.message}")
    print(f"Restored: {rec_failover.restored_nodes}")
    print(f"New Blast Radius: {rec_failover.blast_radius_percentage}%")
    assert rec_failover.success is True

    # Test 3: Recovery with RESTART
    rec_restart = run_recovery_simulation(graph, "payment_api", RecoveryStrategy.RESTART)
    print("\n--- Test 3: Restart Recovery ---")
    print(f"Success: {rec_restart.success}")
    print(f"Message: {rec_restart.message}")
    assert rec_restart.success is True

    # Test 4: Soft dependency failure (recommend_svc)
    res_soft = run_cascade_simulation(graph, "recommend_svc")
    print("\n--- Test 4: Fail recommend_svc (Soft) ---")
    print(f"Summary: {res_soft.summary}")
    print(f"Blast Radius: {res_soft.blast_radius_percentage}%")
    # Gateway should either remain healthy or degrade, not crash
    assert not any(w.node_id == "api_gateway" and w.status == "CASCADED" for w in res_soft.waves)

    print("\nAll backend simulation tests PASSED successfully!")

if __name__ == "__main__":
    test_simulation()
