/** Long-form content for the product detail page, keyed by product id. */
export type ProductDetails = {
  description: string;
  origin: string;
  storage: string;
  highlights: string[];
};

export const productDetails: Record<string, ProductDetails> = {
  ts1: {
    description: "Twelve cans from independent craft breweries: IPAs, pale ales and a crisp lager, picked so every can in the box tastes different.",
    origin: "Brewed in the UK",
    storage: "Store cool and upright, away from direct sunlight. Best served chilled at 4–7°C.",
    highlights: ["12 different styles", "330ml cans", "Recyclable aluminium"],
  },
  ts2: {
    description: "Lean British beef minced fresh every morning with only 10% fat. Ideal for bolognese, burgers, chilli and cottage pie.",
    origin: "Farm-assured British beef",
    storage: "Keep refrigerated at 0–4°C. Use within 2 days of delivery or freeze on the day.",
    highlights: ["10% fat", "Minced daily", "Freezer friendly"],
  },
  ts3: {
    description: "A soft, fluffy farmhouse loaf with a light golden crust, baked overnight in our partner bakery and delivered the same morning.",
    origin: "Baked locally",
    storage: "Keep in a cool, dry place. Best within 3 days, or slice and freeze.",
    highlights: ["Baked overnight", "No preservatives", "Sliced thick"],
  },
  ts4: {
    description: "Deep ruby-red flesh with a sweet, raspberry-like flavour. Great for juicing, salads and desserts.",
    origin: "Sicily, Italy",
    storage: "Store at room temperature for up to 5 days, or refrigerate for up to 2 weeks.",
    highlights: ["Seasonal", "Rich in vitamin C", "Easy to peel"],
  },
  bs1: {
    description: "Certified organic bananas harvested just before ripening so they reach you at their sweetest.",
    origin: "Ecuador",
    storage: "Keep at room temperature, away from other fruit to slow ripening.",
    highlights: ["Certified organic", "Fairtrade", "Ripen in 2–3 days"],
  },
  bs2: {
    description: "A tender, well-marbled sirloin steak cut by our butchers and aged for 21 days for deeper flavour.",
    origin: "Grass-fed British beef",
    storage: "Keep refrigerated at 0–4°C. Use within 3 days or freeze on the day of delivery.",
    highlights: ["21-day aged", "Grass-fed", "Butcher cut"],
  },
  bs3: {
    description: "Juicy yellow melon with pale, honey-sweet flesh. Ripe and ready to slice.",
    origin: "Spain",
    storage: "Store whole at room temperature; refrigerate once cut and eat within 3 days.",
    highlights: ["Ready to eat", "Hand-picked", "Approx. 1.2kg"],
  },
  bs4: {
    description: "Thick-cut potato chips cooked in small batches and finished with sea salt.",
    origin: "Made in the UK",
    storage: "Store in a cool, dry place. Once opened, reseal and eat within 2 days.",
    highlights: ["Gluten free", "Vegan", "Small batch"],
  },
  bs5: {
    description: "Chewy oatmeal cookies made with whole rolled oats, brown sugar and a hint of cinnamon.",
    origin: "Farmart Bakery",
    storage: "Keep in an airtight container at room temperature for up to 5 days.",
    highlights: ["Whole rolled oats", "Baked fresh", "12 cookies"],
  },
  bs6: {
    description: "Whole sardines packed in extra-virgin olive oil. Rich in omega-3 and ready to eat from the tin.",
    origin: "Portugal",
    storage: "Store in a cool, dry place. Once opened, refrigerate and eat within 2 days.",
    highlights: ["High in omega-3", "Extra-virgin olive oil", "Ready to eat"],
  },
  jl1: {
    description: "Sushi-grade salmon on seasoned rice with edamame, avocado, cucumber and sesame dressing.",
    origin: "Made fresh in our kitchen",
    storage: "Keep refrigerated at 0–4°C and eat on the day of delivery.",
    highlights: ["Made today", "High protein", "Ready to eat"],
  },
  jl2: {
    description: "Chargrilled chicken thigh on jasmine rice with steamed greens and a light soy glaze.",
    origin: "Made fresh in our kitchen",
    storage: "Keep refrigerated. Microwave for 2–3 minutes until piping hot.",
    highlights: ["Ready in 3 minutes", "Free-range chicken", "540 kcal"],
  },
  jl3: {
    description: "A full-bodied Cabernet Sauvignon with blackcurrant, cedar and a smooth finish. Pairs well with red meat.",
    origin: "Maipo Valley, Chile",
    storage: "Store on its side in a cool, dark place. Serve at 16–18°C.",
    highlights: ["13.5% ABV", "Vegan friendly", "Award winning"],
  },
  jl4: {
    description: "Raw, unfiltered honey gathered from wildflower meadows. Naturally sets over time.",
    origin: "Local beekeepers",
    storage: "Store at room temperature. If it crystallises, warm the jar gently.",
    highlights: ["Raw & unfiltered", "Local", "Glass jar"],
  },
  jl5: {
    description: "Creamy whole milk from grass-fed cows, pasteurised and bottled within 24 hours of milking.",
    origin: "Dairy Farm, Somerset",
    storage: "Keep refrigerated at 0–5°C. Once opened, use within 3 days.",
    highlights: ["Grass-fed", "Bottled in 24h", "3.6% fat"],
  },
  jl6: {
    description: "Crunchy bone-shaped biscuits baked with real chicken. A daily treat that helps keep teeth clean.",
    origin: "Made in the UK",
    storage: "Store in a cool, dry place and reseal after opening.",
    highlights: ["Real chicken", "No artificial colours", "For adult dogs"],
  },
};
