package com.bikehub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAnalyticsResponse {

    private long totalUsers;
    private long totalBuyers;
    private long totalSellers;
    private long pendingSellerVerifications;

    private long totalBikes;
    private long availableBikes;
    private long soldBikes;

    private long totalOrders;
    private BigDecimal totalRevenue;

    @Builder.Default
    private List<BrandMetric> topBrands = new ArrayList<>();

    @Builder.Default
    private List<CityMetric> topCities = new ArrayList<>();

    @Builder.Default
    private List<MonthlyRevenueMetric> monthlyRevenue = new ArrayList<>();

    @Builder.Default
    private List<OrderResponse> recentOrders = new ArrayList<>();
}
