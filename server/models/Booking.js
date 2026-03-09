import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {
        // User who made the booking
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // Trip this booking is associated with
        tripId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Trip",
            required: true,
        },

        // Business being booked
        businessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Business",
            required: true,
            index: true,
        },

        // Type of booking
        bookingType: {
            type: String,
            enum: ["hotel", "rental", "tour"],
            required: true,
            index: true,
        },

        // Dates
        checkIn: {
            type: Date,
            required: true,
        },
        checkOut: {
            type: Date,
            required: true,
        },

        // Hotel-specific
        roomType: String,
        guests: Number,

        // Rental-specific
        pickupLocation: String,
        returnLocation: String,

        // Tour-specific
        tourDay: Number,
        participants: Number,

        // Pricing
        basePrice: {
            type: Number,
            required: true,
        },
        totalPrice: {
            type: Number,
            required: true,
        },

        // Status
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled", "completed"],
            default: "pending",
            index: true,
        },

        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "refunded", "failed"],
            default: "pending",
        },

        // Additional info
        specialRequests: String,
        contactInfo: {
            phone: String,
            email: String,
        },

        // Cancellation
        cancelledAt: Date,
        cancellationReason: String,

        // Business management fields
        statusUpdatedAt: Date,
        statusUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        rejectedReason: String,
        businessNotes: String,
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ businessId: 1, status: 1 });
bookingSchema.index({ tripId: 1 });

// Calculate number of nights/days
bookingSchema.virtual("duration").get(function () {
    const diffTime = Math.abs(this.checkOut - this.checkIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

export default mongoose.model("Booking", bookingSchema);
