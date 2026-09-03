export interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  imageCaption: string;
  date: string;
  author: string;
  authorRole: string;
  readTime: string;
  category: string;
  sections: {
    heading?: string;
    paragraphs: string[];
  }[];
  keyPoints?: string[];
}

export const blogs: BlogPost[] = [
  {
    id: '1',
    title: 'The Real Health & Environmental Benefits of Choosing Organic Produce',
    subtitle: 'A practical look at why farm-fresh, chemical-free vegetables make a tangible difference to your daily nutrition and long-term well-being.',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop',
    imageCaption: 'Freshly harvested organic greens at a local partner farm.',
    date: 'October 15, 2026',
    author: 'Dr. Ramesh Sharma',
    authorRole: 'Clinical Nutritionist & Agricultural Researcher',
    readTime: '5 min read',
    category: 'Nutrition & Wellness',
    sections: [
      {
        heading: 'Why Soil Quality Matters More Than You Think',
        paragraphs: [
          'When we talk about organic vegetables, the conversation often centers on what isn’t there—no synthetic pesticides, no artificial chemical sprays, and no weedkillers. But equally important is what is present in the soil.',
          'Organic soil is enriched with natural compost and green manure rather than petroleum-based nitrogen fertilizers. As a result, plants draw a richer profile of essential minerals—including magnesium, iron, and zinc—directly into their leaves and roots.'
        ]
      },
      {
        heading: 'Antioxidants and Natural Flavor',
        paragraphs: [
          'Because organic crops aren’t protected by chemical shields, they naturally produce self-defense compounds known as polyphenols and antioxidants. These are the very same compounds that provide anti-inflammatory benefits to humans when consumed.',
          'Additionally, without excessive nitrogen boosting water weight in the produce, organic vegetables feature a higher concentration of natural sugars and aromatic compounds—yielding richer, more authentic flavor.'
        ]
      },
      {
        heading: 'Making Practical Choices for Your Kitchen',
        paragraphs: [
          'Transitioning to organic doesn’t have to be all-or-nothing. Starting with everyday staples like leafy greens, tomatoes, and herbs—which typically absorb the highest pesticide residues in conventional farming—is a practical first step for any household.'
        ]
      }
    ],
    keyPoints: [
      'Zero synthetic pesticide or fertilizer residues',
      'Higher natural antioxidant and mineral density',
      'Protects local groundwater and soil fertility'
    ]
  },
  {
    id: '2',
    title: 'How to Keep Fresh Vegetables Crisp and Fresh for Weeks',
    subtitle: 'Simple, moisture-control strategies to eliminate food waste and preserve nutrients in your kitchen.',
    image: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?q=80&w=1200&auto=format&fit=crop',
    imageCaption: 'Organized crisper drawer with properly stored root vegetables and greens.',
    date: 'October 10, 2026',
    author: 'Sunita Patel',
    authorRole: 'Culinary Instructor & Food Preservation Lead',
    readTime: '4 min read',
    category: 'Kitchen Guide',
    sections: [
      {
        heading: 'The Secret to Storing Leafy Greens',
        paragraphs: [
          'Moisture is both a friend and enemy to fresh produce. Excess moisture on leaves leads to quick rotting, while dry air causes wilting.',
          'To keep spinach, coriander, and methi fresh for up to 10 days, wash them immediately only if you dry them completely using a salad spinner or clean kitchen towels. Store them in airtight glass or BPA-free containers lined with a dry paper towel to catch humidity.'
        ]
      },
      {
        heading: 'Root Vegetables Need Darkness and Ventilation',
        paragraphs: [
          'Potatoes, onions, and garlic thrive in cool, dark spaces with steady airflow. Keep them out of plastic bags and never store potatoes and onions in the same basket.',
          'Onions release ethylene gas which accelerates sprouting in potatoes. Keep them at least a few feet apart in open mesh baskets.'
        ]
      }
    ],
    keyPoints: [
      'Line vegetable containers with cotton or paper towels to manage moisture',
      'Store ethylene producers like ripe bananas and apples separately',
      'Keep root vegetables in dark, ventilated baskets'
    ]
  },
  {
    id: '3',
    title: 'Understanding Bilona Ghee: The Traditional Hand-Churned Craft',
    subtitle: 'Discover the ancient Indian two-way churn method of preparing pure A2 cow ghee from cultured curd.',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?q=80&w=1200&auto=format&fit=crop',
    imageCaption: 'Simmering cultured butter over low flame to extract golden Bilona Ghee.',
    date: 'October 5, 2026',
    author: 'Kavita Mehta',
    authorRole: 'Traditional Dairy Craft Specialist',
    readTime: '6 min read',
    category: 'Heritage Foods',
    sections: [
      {
        heading: 'The Core Difference: Curd vs. Industrial Milk Cream',
        paragraphs: [
          'Most commercial ghee is produced rapidly by separating industrial milk cream and boiling it at high temperatures. In contrast, authentic Bilona Ghee is made using the Vedic method.',
          'Fresh A2 cow milk is boiled, cooled, and set into whole curd overnight. This curd is then churned bidirectional using a wooden churner (Bilona) to separate fresh butter (Makkhan), which is then gently simmered to yield golden, aromatic ghee.'
        ]
      },
      {
        heading: 'Digestibility and Nutritional Benefits',
        paragraphs: [
          'Culturing the milk into curd breaks down lactose and proteins before churning. This makes Bilona Ghee exceptionally easy on the stomach, even for individuals sensitive to regular dairy.',
          'It is naturally rich in short-chain fatty acids like butyrate, which nourishes the intestinal lining, supports healthy digestion, and provides a high smoke point perfect for traditional Indian cooking.'
        ]
      }
    ],
    keyPoints: [
      'Made exclusively from cultured A2 curd, not raw cream',
      'Bidirectional wooden churning preserves delicate nutrients',
      'Rich in butyric acid and fat-soluble vitamins A, D, E & K'
    ]
  }
];
