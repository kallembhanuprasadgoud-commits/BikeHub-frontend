# BikeHub – Entity-Relationship (ER) Architecture

## 1. ER Diagram (Mermaid)

```mermaid
erDiagram
    USERS ||--o| SELLER_PROFILES : "has (1:1)"
    USERS ||--o{ BIKES : "lists as seller (1:N)"
    USERS ||--o{ WISHLIST : "saves (1:N)"
    USERS ||--o{ ORDERS : "places as buyer (1:N)"
    USERS ||--o{ REVIEWS : "writes as reviewer (1:N)"
    USERS ||--o{ REVIEWS : "receives as seller (1:N)"
    USERS ||--o{ CHAT_ROOMS : "participates as buyer (1:N)"
    USERS ||--o{ CHAT_ROOMS : "participates as seller (1:N)"
    USERS ||--o{ CHAT_MESSAGES : "sends (1:N)"
    USERS ||--o{ NOTIFICATIONS : "receives (1:N)"
    USERS ||--o{ USER_ACTIVITY : "triggers (1:N)"

    BIKES ||--o{ BIKE_IMAGES : "contains (1:N)"
    BIKES ||--o{ WISHLIST : "is wishlisted (1:N)"
    BIKES ||--o{ ORDERS : "ordered in (1:N)"
    BIKES ||--o{ REVIEWS : "reviewed for (1:N)"
    BIKES ||--o{ CHAT_ROOMS : "discussed in (1:N)"
    BIKES ||--o{ USER_ACTIVITY : "associated with (1:N)"

    ORDERS ||--|| PAYMENTS : "paid via (1:1)"
    CHAT_ROOMS ||--o{ CHAT_MESSAGES : "contains (1:N)"

    USERS {
        bigint id PK
        varchar name
        varchar email UK
        varchar password
        varchar phone
        enum role
        enum status
        timestamp created_at
    }

    SELLER_PROFILES {
        bigint id PK
        bigint user_id FK "UK"
        varchar shop_name
        varchar address
        varchar city
        enum verification_status
        varchar document_url
        timestamp verified_at
    }

    BIKES {
        bigint id PK
        bigint seller_id FK
        varchar brand "Indexed"
        varchar model
        int year "Indexed"
        int km_driven
        varchar fuel_type
        int engine_cc
        enum bike_condition
        decimal price "Indexed"
        text description
        varchar city "Indexed"
        enum status "Indexed"
        timestamp created_at
    }

    BIKE_IMAGES {
        bigint id PK
        bigint bike_id FK
        varchar image_url
        boolean is_primary
    }

    WISHLIST {
        bigint id PK
        bigint user_id FK
        bigint bike_id FK
    }

    ORDERS {
        bigint id PK
        bigint buyer_id FK
        bigint bike_id FK
        decimal amount
        enum status
        timestamp created_at
    }

    PAYMENTS {
        bigint id PK
        bigint order_id FK "UK"
        varchar gateway_payment_id "Indexed"
        enum status
        varchar method
        timestamp paid_at
    }

    REVIEWS {
        bigint id PK
        bigint reviewer_id FK
        bigint seller_id FK
        bigint bike_id FK
        tinyint rating
        text comment
        timestamp created_at
    }

    CHAT_ROOMS {
        bigint id PK
        bigint buyer_id FK
        bigint seller_id FK
        bigint bike_id FK
    }

    CHAT_MESSAGES {
        bigint id PK
        bigint room_id FK
        bigint sender_id FK
        text content
        timestamp sent_at
        boolean is_read
    }

    NOTIFICATIONS {
        bigint id PK
        bigint user_id FK
        varchar type
        varchar message
        boolean is_read
        timestamp created_at
    }

    USER_ACTIVITY {
        bigint id PK
        bigint user_id FK
        bigint bike_id FK
        enum action_type
        varchar search_term
        timestamp created_at
    }
```

## 2. Cardinality & Relationship Breakdown

| Relationship | Entities Involved | Cardinality | Business Logic & Integrity Constraints |
|:---|:---|:---|:---|
| **User & Seller Profile** | `users` &harr; `seller_profiles` | **1 : 0..1** (Strict 1:1) | A user can opt to become a seller. `user_id` has a unique constraint. If a user is deleted, their seller profile cascades (`ON DELETE CASCADE`). |
| **Seller & Bikes** | `users` &harr; `bikes` | **1 : N** | A verified seller lists 0 to many bikes. Each bike is owned by exactly 1 seller (`seller_id`). |
| **Bike & Images** | `bikes` &harr; `bike_images` | **1 : N** | Each bike has 1 or more images. Exactly one image has `is_primary = TRUE` for catalog thumbnails. |
| **Buyer & Wishlist** | `users` &harr; `wishlist` &harr; `bikes` | **M : N** | A buyer can bookmark many bikes; a bike can be saved by many buyers. Unique constraint `(user_id, bike_id)` prevents duplicates. |
| **Buyer, Bike & Order** | `users`, `bikes` &harr; `orders` | **1 : N** | A buyer can place orders. A bike can be purchased in an order. `ON DELETE RESTRICT` protects purchase audits. |
| **Order & Payment** | `orders` &harr; `payments` | **1 : 1** | Exactly one payment record exists per order (`order_id` is unique in `payments`). Tracks Razorpay/Stripe transaction ID and method. |
| **Reviewer, Seller & Bike** | `users`, `bikes` &harr; `reviews` | **1 : N** | A buyer can review a seller after purchase. Rating is constrained `BETWEEN 1 AND 5`. |
| **Chat Room & Messages** | `users`, `bikes`, `chat_rooms` &harr; `chat_messages` | **1 : N** | A room is unique per `(buyer_id, seller_id, bike_id)`. Contains sequential messages ordered by timestamp. |
| **User & Notifications** | `users` &harr; `notifications` | **1 : N** | Real-time push notifications for order updates, seller verifications, and chat alerts. |
| **User Activity** | `users`, `bikes` &harr; `user_activity` | **1 : N** | Captures interaction events (`VIEW`, `SEARCH`, `WISHLIST`, `CHAT`) for the AI content-based recommendation engine. |

## 3. Database Normalization (3NF) Compliance

1. **First Normal Form (1NF)**:
   - All attributes contain atomic values (no comma-separated image URLs or arrays; images are stored in a dedicated `bike_images` table).
   - Each table has a designated primary key (`id` with auto-increment).
2. **Second Normal Form (2NF)**:
   - All non-key columns depend on the entire primary key, eliminating partial dependencies.
3. **Third Normal Form (3NF)**:
   - No transitive dependencies exist. For example, seller business details (`shop_name`, `address`, `city`) reside in `seller_profiles`, not duplicated inside the `bikes` or `users` tables.
