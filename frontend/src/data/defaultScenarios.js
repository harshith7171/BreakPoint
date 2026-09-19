export const DEFAULT_SCENARIOS = [
  {
    id: "ecommerce",
    name: "E-Commerce Checkout & Payments",
    description: "Demonstrates how a payment gateway or primary database failure cascades up to the API Gateway and Client, while soft dependencies like recommendations degrade gracefully.",
    nodes: [
      { id: "client", label: "Web & Mobile Client", type: "gateway", status: "HEALTHY", position: { x: 40, y: 180 }, description: "Customer web storefront and mobile application" },
      { id: "cdn", label: "Cloud CDN", type: "gateway", status: "HEALTHY", position: { x: 260, y: 180 }, description: "Edge routing & static asset caching" },
      { id: "api_gateway", label: "API Gateway", type: "gateway", status: "HEALTHY", position: { x: 480, y: 180 }, description: "Central entrypoint routing traffic to internal microservices" },
      { id: "auth_svc", label: "Auth Service", type: "service", status: "HEALTHY", position: { x: 720, y: 60 }, description: "Token verification and user session validation" },
      { id: "order_svc", label: "Order Service", type: "service", status: "HEALTHY", position: { x: 720, y: 180 }, description: "Processes shopping carts and creates checkout orders" },
      { id: "recommend_svc", label: "Recommendation Engine", type: "service", status: "HEALTHY", position: { x: 720, y: 310 }, description: "AI-powered product upsells (Soft dependency)" },
      { id: "payment_api", label: "Stripe Payment Gateway", type: "third_party", status: "HEALTHY", position: { x: 970, y: 120 }, description: "External credit card & payment authorization", backup_node_id: "backup_payment" },
      { id: "backup_payment", label: "PayPal Backup Gateway", type: "third_party", status: "HEALTHY", position: { x: 970, y: 230 }, description: "Secondary standby payment gateway for failover" },
      { id: "inventory_db", label: "Inventory PostgreSQL", type: "database", status: "HEALTHY", position: { x: 970, y: 340 }, description: "Primary database for product inventory & orders", backup_node_id: "inventory_replica" },
      { id: "inventory_replica", label: "Inventory Standby Replica", type: "database", status: "HEALTHY", position: { x: 970, y: 450 }, description: "Read-replica ready for hot failover" }
    ],
    edges: [
      { id: "e1", source: "client", target: "cdn", dependency_type: "hard", label: "HTTPS" },
      { id: "e2", source: "cdn", target: "api_gateway", dependency_type: "hard", label: "Proxy" },
      { id: "e3", source: "api_gateway", target: "auth_svc", dependency_type: "hard", label: "Verify" },
      { id: "e4", source: "api_gateway", target: "order_svc", dependency_type: "hard", label: "Checkout" },
      { id: "e5", source: "api_gateway", target: "recommend_svc", dependency_type: "soft", label: "Upsell (Soft)" },
      { id: "e6", source: "order_svc", target: "payment_api", dependency_type: "hard", label: "Charge" },
      { id: "e7", source: "order_svc", target: "inventory_db", dependency_type: "hard", label: "Stock & Order" }
    ]
  },
  {
    id: "microservices",
    name: "Microservices with Cache & DB Cluster",
    description: "Explores how cache failures or database overloads ripple through downstream services and test failover to read replicas.",
    nodes: [
      { id: "load_balancer", label: "Load Balancer (HAProxy)", type: "gateway", status: "HEALTHY", position: { x: 80, y: 200 }, description: "Distributes incoming web traffic across services" },
      { id: "user_svc", label: "User Profile Service", type: "service", status: "HEALTHY", position: { x: 360, y: 100 }, description: "Handles account info, authentication tokens" },
      { id: "product_svc", label: "Product Catalog Service", type: "service", status: "HEALTHY", position: { x: 360, y: 300 }, description: "Fetches items, prices, and search results" },
      { id: "redis_cache", label: "Redis Cluster Cache", type: "cache", status: "HEALTHY", position: { x: 650, y: 100 }, description: "In-memory caching (Soft dependency)" },
      { id: "primary_db", label: "Primary Master DB", type: "database", status: "HEALTHY", position: { x: 650, y: 300 }, description: "Central relational database write cluster", backup_node_id: "replica_db" },
      { id: "replica_db", label: "Standby Read Replica", type: "database", status: "HEALTHY", position: { x: 650, y: 440 }, description: "Warm standby for database failover" },
      { id: "analytics_queue", label: "Kafka Event Queue", type: "queue", status: "HEALTHY", position: { x: 930, y: 200 }, description: "Async telemetry stream (Soft dependency)" }
    ],
    edges: [
      { id: "e1", source: "load_balancer", target: "user_svc", dependency_type: "hard", label: "Route" },
      { id: "e2", source: "load_balancer", target: "product_svc", dependency_type: "hard", label: "Route" },
      { id: "e3", source: "user_svc", target: "redis_cache", dependency_type: "soft", label: "Session Cache" },
      { id: "e4", source: "user_svc", target: "primary_db", dependency_type: "hard", label: "User Store" },
      { id: "e5", source: "product_svc", target: "redis_cache", dependency_type: "soft", label: "Catalog Cache" },
      { id: "e6", source: "product_svc", target: "primary_db", dependency_type: "hard", label: "Product Store" },
      { id: "e7", source: "user_svc", target: "analytics_queue", dependency_type: "soft", label: "Async Events" }
    ]
  },
  {
    id: "banking",
    name: "Financial Transaction & Fraud Pipeline",
    description: "Simulates high-reliability banking infrastructure with automated fraud gates and multi-site synchronous ledger backups.",
    nodes: [
      { id: "mobile_app", label: "Mobile Banking Client", type: "gateway", status: "HEALTHY", position: { x: 60, y: 180 }, description: "Customer mobile application frontend" },
      { id: "secure_gateway", label: "mTLS Security Gateway", type: "gateway", status: "HEALTHY", position: { x: 300, y: 180 }, description: "Cryptographic authentication & firewall" },
      { id: "fraud_svc", label: "Real-time Fraud AI", type: "service", status: "HEALTHY", position: { x: 560, y: 80 }, description: "Hard gate: transactions cannot execute without fraud signoff" },
      { id: "transfer_svc", label: "Wire Transfer Service", type: "service", status: "HEALTHY", position: { x: 560, y: 280 }, description: "Core money movement orchestrator" },
      { id: "core_ledger", label: "Primary Core Ledger DB", type: "database", status: "HEALTHY", position: { x: 840, y: 130 }, description: "Immutable bank ledger database", backup_node_id: "backup_ledger" },
      { id: "backup_ledger", label: "Disaster Recovery Ledger", type: "database", status: "HEALTHY", position: { x: 840, y: 270 }, description: "Synchronous replica in second data center" },
      { id: "sms_notifier", label: "SMS & Push Notifier", type: "service", status: "HEALTHY", position: { x: 840, y: 400 }, description: "Customer transaction alerts (Soft dependency)" }
    ],
    edges: [
      { id: "e1", source: "mobile_app", target: "secure_gateway", dependency_type: "hard", label: "mTLS" },
      { id: "e2", source: "secure_gateway", target: "fraud_svc", dependency_type: "hard", label: "Risk Score" },
      { id: "e3", source: "secure_gateway", target: "transfer_svc", dependency_type: "hard", label: "Execute" },
      { id: "e4", source: "transfer_svc", target: "fraud_svc", dependency_type: "hard", label: "Approval" },
      { id: "e5", source: "transfer_svc", target: "core_ledger", dependency_type: "hard", label: "Commit" },
      { id: "e6", source: "transfer_svc", target: "sms_notifier", dependency_type: "soft", label: "Alert (Soft)" }
    ]
  },
  {
    id: "streaming",
    name: "Global Video Streaming Platform (Netflix / YouTube)",
    description: "Models video delivery architecture. Shows why a DRM license failure halts video playback globally even when CDN chunks are cached, and tests failover to redundant license vaults.",
    nodes: [
      { id: "smart_tv_app", label: "Smart TV & Web Player", type: "gateway", status: "HEALTHY", position: { x: 50, y: 180 }, description: "Video client rendering HLS stream" },
      { id: "global_cdn", label: "Global Edge CDN", type: "gateway", status: "HEALTHY", position: { x: 270, y: 180 }, description: "Delivers cached encrypted video chunks" },
      { id: "streaming_api", label: "Streaming API Gateway", type: "gateway", status: "HEALTHY", position: { x: 500, y: 180 }, description: "Playback session negotiator" },
      { id: "drm_server", label: "Widevine/FairPlay DRM", type: "service", status: "HEALTHY", position: { x: 760, y: 70 }, description: "Decryption keys (Hard dependency: player cannot decode without keys)", backup_node_id: "drm_backup_vault" },
      { id: "drm_backup_vault", label: "Standby DRM Vault", type: "service", status: "HEALTHY", position: { x: 760, y: 190 }, description: "Secondary redundant key management vault" },
      { id: "catalog_db", label: "Title Catalog & Manifest DB", type: "database", status: "HEALTHY", position: { x: 760, y: 310 }, description: "Resolves bitrate ladders & video chunk URLs" },
      { id: "ad_decision_svc", label: "Dynamic Ad Insertion", type: "service", status: "HEALTHY", position: { x: 760, y: 430 }, description: "Targeted video ad stitcher (Soft dependency)" },
      { id: "recs_engine", label: "Next-Watch Recommender", type: "service", status: "HEALTHY", position: { x: 1020, y: 240 }, description: "AI recommendation carousel (Soft dependency)" }
    ],
    edges: [
      { id: "e1", source: "smart_tv_app", target: "global_cdn", dependency_type: "hard", label: "Fetch Chunks" },
      { id: "e2", source: "global_cdn", target: "streaming_api", dependency_type: "hard", label: "Session Auth" },
      { id: "e3", source: "streaming_api", target: "drm_server", dependency_type: "hard", label: "License Key" },
      { id: "e4", source: "streaming_api", target: "catalog_db", dependency_type: "hard", label: "Manifest" },
      { id: "e5", source: "streaming_api", target: "ad_decision_svc", dependency_type: "soft", label: "Pre-roll Ads" },
      { id: "e6", source: "catalog_db", target: "recs_engine", dependency_type: "soft", label: "Related (Soft)" }
    ]
  },
  {
    id: "iot_fleet",
    name: "Autonomous Vehicle & IoT Telemetry Network",
    description: "Simulates connected vehicle telemetry. Demonstrates that emergency safety overrides are mission-critical hard gates, while live map updates degrade safely.",
    nodes: [
      { id: "car_fleet", label: "Autonomous Car Fleet", type: "gateway", status: "HEALTHY", position: { x: 50, y: 200 }, description: "50,000+ connected vehicles streaming radar & lidar data" },
      { id: "mqtt_ingress", label: "5G MQTT Ingress Broker", type: "gateway", status: "HEALTHY", position: { x: 280, y: 200 }, description: "Low-latency message ingress cluster" },
      { id: "safety_monitor", label: "Critical Collision Safety", type: "service", status: "HEALTHY", position: { x: 550, y: 90 }, description: "Immediate collision override (Hard dependency)" },
      { id: "telemetry_router", label: "Fleet Routing Controller", type: "service", status: "HEALTHY", position: { x: 550, y: 300 }, description: "Coordinates highway speed & lane platooning" },
      { id: "timeseries_db", label: "InfluxDB Cluster", type: "database", status: "HEALTHY", position: { x: 820, y: 160 }, description: "High-throughput sensor telemetry store", backup_node_id: "timeseries_replica" },
      { id: "timeseries_replica", label: "Telemetry Cold Standby", type: "database", status: "HEALTHY", position: { x: 820, y: 280 }, description: "Offsite telemetry read/write standby" },
      { id: "traffic_maps", label: "Live Traffic Tile Map API", type: "third_party", status: "HEALTHY", position: { x: 820, y: 410 }, description: "Congestion & construction overlays (Soft dependency)" }
    ],
    edges: [
      { id: "e1", source: "car_fleet", target: "mqtt_ingress", dependency_type: "hard", label: "5G Stream" },
      { id: "e2", source: "mqtt_ingress", target: "safety_monitor", dependency_type: "hard", label: "Emergency Signoff" },
      { id: "e3", source: "mqtt_ingress", target: "telemetry_router", dependency_type: "hard", label: "Telemetry" },
      { id: "e4", source: "telemetry_router", target: "safety_monitor", dependency_type: "hard", label: "Safety Sync" },
      { id: "e5", source: "telemetry_router", target: "timeseries_db", dependency_type: "hard", label: "Sensors" },
      { id: "e6", source: "telemetry_router", target: "traffic_maps", dependency_type: "soft", label: "Live Maps (Soft)" }
    ]
  },
  {
    id: "social_feed",
    name: "Social Network Live Feed & Fan-Out",
    description: "Models timeline generation across millions of followers. Demonstrates how graph database failure breaks feed generation, and how circuit breakers allow fallback to cached posts.",
    nodes: [
      { id: "mobile_clients", label: "iOS & Android Clients", type: "gateway", status: "HEALTHY", position: { x: 50, y: 180 }, description: "Active users pulling social feeds" },
      { id: "graphql_gw", label: "GraphQL Federation Gateway", type: "gateway", status: "HEALTHY", position: { x: 280, y: 180 }, description: "Federates posts, profiles, and media" },
      { id: "timeline_svc", label: "Timeline Feed Generator", type: "service", status: "HEALTHY", position: { x: 540, y: 180 }, description: "Assembles reverse-chronological and ranked posts" },
      { id: "social_graph_db", label: "Neo4j Social Follow Graph", type: "database", status: "HEALTHY", position: { x: 800, y: 80 }, description: "Who follows whom relationship store (Hard dependency)", backup_node_id: "graph_replica" },
      { id: "graph_replica", label: "Social Graph Read Replica", type: "database", status: "HEALTHY", position: { x: 800, y: 200 }, description: "In-sync read replica for graph queries" },
      { id: "feed_cache", label: "Redis Feed Cache", type: "cache", status: "HEALTHY", position: { x: 800, y: 310 }, description: "Pre-computed home timeline (Soft dependency)" },
      { id: "push_worker", label: "APNs Push Notification Queue", type: "queue", status: "HEALTHY", position: { x: 800, y: 430 }, description: "Async mobile push alerts (Soft dependency)" }
    ],
    edges: [
      { id: "e1", source: "mobile_clients", target: "graphql_gw", dependency_type: "hard", label: "HTTPS / WSS" },
      { id: "e2", source: "graphql_gw", target: "timeline_svc", dependency_type: "hard", label: "Get Feed" },
      { id: "e3", source: "timeline_svc", target: "social_graph_db", dependency_type: "hard", label: "Followers" },
      { id: "e4", source: "timeline_svc", target: "feed_cache", dependency_type: "soft", label: "Feed Cache" },
      { id: "e5", source: "timeline_svc", target: "push_worker", dependency_type: "soft", label: "Like Alerts" }
    ]
  }
];
