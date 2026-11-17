export interface MockLogs {
    id: string; // transaction ID
    record_id: string; // ID of record affected
    table_name: string; // Name of table affected
    action: string; // Action Done (i.e, DELETE, CREATE, UPDATE)
    old_data: string; // Old Data in Json
    new_data: string; // New Data in Json
    user_id: string; // ID of user who made the change
    user_name: string; // ID of user who made the change
    created_at: string; // date & time log was created
    details: string;
}

export const mockAuditLogData: MockLogs[] = [
    {
        id: "LOG-0001",
        record_id: "VH-016",
        table_name: "vehicle",
        action: "CREATE",
        old_data: "{}",
        new_data:
            '{"plate_number":"ABC-1016","vehicle_type":"Car","year":2024,"weight_capacity":400,"initial_odometer":5000,"is_active":true}',
        user_id: "MGR-0001",
        user_name: "Admin",
        created_at: "2026-11-16T09:42:18+08:00",
        details: "Registered new vehicle ABC-1016 (Toyota Wigo) to the fleet.",
    },
    {
        id: "LOG-0002",
        record_id: "VH-004",
        table_name: "vehicle",
        action: "UPDATE",
        old_data: '{"driver_id":"","status":"STANDBY"}',
        new_data: '{"driver_id":"DRV-004","status":"EN ROUTE"}',
        user_id: "MGR-0001",
        user_name: "Admin",
        created_at: "2026-11-16T08:15:03+08:00",
        details:
            "Assigned John Doe to ABC-1004 and changed status from STANDBY to EN ROUTE.",
    },
    {
        id: "LOG-0003",
        record_id: "DRV-010",
        table_name: "agent_profile",
        action: "UPDATE",
        old_data: '{"driver_id":"DRV-010","archived_at":null}',
        new_data:
            '{"driver_id":"DRV-010","archived_at":"2026-11-15T17:58:44+08:00"}',
        user_id: "MGR-0002",
        user_name: "John",
        created_at: "2026-11-15T17:58:44+08:00",
        details: "Archived driver Ethan Winters (DRV-010) — no longer active.",
    },
    {
        id: "LOG-0004",
        record_id: "TRP-0001",
        table_name: "trip",
        action: "CREATE",
        old_data: "{}",
        new_data:
            '{"driver_id_":"DRV-001","vehicle_id_":"VH-001","route_id_":"RTE-0001","status":"PENDING","scheduled_date":"2026-11-16"}',
        user_id: "MGR-0002",
        user_name: "John",
        created_at: "2026-11-15T14:20:09+08:00",
        details:
            "Created trip for Juan Dela Cruz using van ABC-1001 on route RTE-0001.",
    },
    {
        id: "LOG-0005",
        record_id: "FL-0001",
        table_name: "fuel_log",
        action: "UPDATE",
        old_data:
            '{"odometer_reading":15234,"liters_added":32.5,"fuel_efficiency":9.8,"needs_attention":false}',
        new_data:
            '{"odometer_reading":15234,"liters_added":32.5,"fuel_efficiency":6.4,"needs_attention":true}',
        user_id: "MGR-0001",
        user_name: "Admin",
        created_at: "2026-11-14T11:05:37+08:00",
        details:
            "Flagged fuel log FL-0001 for review — efficiency dropped below the expected km/L.",
    },
];
