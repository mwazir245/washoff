import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Star, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Layout from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";

const Rating = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Thank you for your feedback!",
      description: "Your rating has been submitted successfully.",
    });

    navigate("/orders");
  };

  return (
    <Layout showBottomNav={false}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b border-border sticky top-16 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link to="/orders">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">Rate Your Order</h1>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto">
            {/* Order Summary */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <img
                    src="https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=100&h=100&fit=crop"
                    alt="Fresh & Clean Laundry"
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div>
                    <h3 className="font-semibold">Fresh & Clean Laundry</h3>
                    <p className="text-sm text-muted-foreground">
                      Order #{orderId || "ORD123"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      3 kg wash, 5 items iron
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rating Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  How was your experience?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Star Rating */}
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-10 w-10 transition-colors ${
                          star <= (hoveredRating || rating)
                            ? "fill-warning text-warning"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Rating Label */}
                <p className="text-center text-muted-foreground">
                  {rating === 0 && "Tap to rate"}
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent!"}
                </p>

                {/* Feedback */}
                <div className="space-y-2">
                  <Label htmlFor="feedback">
                    Share your experience (optional)
                  </Label>
                  <Textarea
                    id="feedback"
                    placeholder="Tell us what you liked or what we can improve..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Submit Button */}
                <Button className="w-full" size="lg" onClick={handleSubmit}>
                  Submit Rating
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate("/orders")}
                >
                  Skip for now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Rating;
