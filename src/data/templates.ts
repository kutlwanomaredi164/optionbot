import { ChatbotConfig, MainMenuItem } from '../types';

export interface TemplateDefinition {
  id: string;
  name: string;
  industry: string;
  description: string;
  icon: string;
  defaultMenuItems: MainMenuItem[];
  defaultKnowledge: { title: string; category: any; type: any; content: string; tags: string[] }[];
  defaultAiPrompt: string;
}

export const STARTER_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'photography',
    name: 'Photography Studio',
    industry: 'Photography Studio',
    description: 'Designed for portrait, wedding, family, and commercial photographers with portfolio galleries and booking workflows.',
    icon: 'camera',
    defaultMenuItems: [
      {
        id: 'menu_services',
        title: 'Services & Prices',
        description: 'Explore portrait, wedding, and event packages',
        icon: 'camera',
        isHidden: false,
        order: 1,
        subtopics: [
          {
            id: 'sub_portrait',
            title: 'Portrait Sessions',
            description: 'Individual, executive headshot, and creative portraits',
            order: 1,
            contentType: 'service_product',
            content: {
              serviceProduct: {
                name: 'Signature Portrait Session',
                description: 'A 60-minute in-studio or on-location portrait experience with professional lighting, outfit changes, and master retouching.',
                price: 'R 290.00',
                pricingMethod: 'starting_at',
                duration: '60 minutes',
                inclusions: [
                  '1-hour shooting time',
                  '2 wardrobe changes',
                  'Online proofing gallery with 40+ proofs',
                  '5 high-resolution retouched digital files'
                ],
                exclusions: [
                  'Hair and makeup styling (available as +R 95.00 add-on)',
                  'Fine-art prints (ordered separately via client store)'
                ],
                actionLabel: 'Book Session',
                linkedActionId: 'act_book_portrait'
              }
            }
          },
          {
            id: 'sub_wedding',
            title: 'Wedding Photography',
            description: 'Full-day and elopement wedding coverage',
            order: 2,
            contentType: 'service_product',
            content: {
              serviceProduct: {
                name: 'The Storyteller Wedding Collection',
                description: 'Full-day documentary wedding coverage by lead photographer with second shooter, engagement session, and heirloom album.',
                price: 'R 2,850.00',
                pricingMethod: 'fixed',
                duration: '8 hours',
                inclusions: [
                  '8 hours coverage with 2 photographers',
                  'Complimentary 1-hour engagement session',
                  '500+ hand-edited high-res photos with print rights',
                  'Private online gallery with 1-year cloud backup'
                ],
                exclusions: [
                  'Travel outside 50 km (R 12.50/km)',
                  'Overtime hours billed at R 300.00/hour'
                ],
                actionLabel: 'Check Date Availability',
                linkedActionId: 'act_wedding_quote'
              }
            }
          },
          {
            id: 'sub_commercial',
            title: 'Commercial & Branding',
            description: 'Brand storytelling, product shots, and team headshots',
            order: 3,
            contentType: 'service_product',
            content: {
              serviceProduct: {
                name: 'Brand Imagery Package',
                description: 'Tailored commercial visual assets for websites, social campaigns, and press kits.',
                price: 'R 1,200.00',
                pricingMethod: 'starting_at',
                duration: 'Half-day (4 hours)',
                inclusions: [
                  'Pre-shoot mood board and creative consultation',
                  '4 hours on-site photography',
                  'Commercial usage license for digital and print',
                  '35 fully retouched brand assets'
                ],
                actionLabel: 'Request Commercial Quote',
                linkedActionId: 'act_quote'
              }
            }
          }
        ]
      },
      {
        id: 'menu_portfolio',
        title: 'Portfolio & Galleries',
        description: 'View curated highlights from recent sessions',
        icon: 'image',
        isHidden: false,
        order: 2,
        subtopics: [
          {
            id: 'sub_gallery_weddings',
            title: 'Featured Weddings',
            description: 'Emotional moments, venues, and candid highlights',
            order: 1,
            contentType: 'gallery',
            content: {
              gallery: {
                galleryName: 'Wedding & Editorial Highlights',
                images: [
                  { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80', caption: 'Sunset vow exchange overlooking coastal cliffs', category: 'Ceremony' },
                  { url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80', caption: 'Intimate first dance in vintage greenhouse', category: 'Reception' },
                  { url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80', caption: 'Bridal preparation and natural morning light', category: 'Details' }
                ],
                approvedPortfolioLinks: [
                  { label: 'View Full Client Gallery (Pixieset)', url: 'https://lenslight.pixieset.com' }
                ]
              }
            }
          },
          {
            id: 'sub_gallery_portraits',
            title: 'Studio Portraits',
            description: 'Fine art and modern editorial portraits',
            order: 2,
            contentType: 'gallery',
            content: {
              gallery: {
                galleryName: 'Studio & Natural Light Portraits',
                images: [
                  { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80', caption: 'High-contrast studio editorial portrait', category: 'Studio' },
                  { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80', caption: 'Executive headshot for technology founder', category: 'Corporate' }
                ]
              }
            }
          }
        ]
      },
      {
        id: 'menu_policies',
        title: 'Policies & Information',
        description: 'Session prep, turnaround times, and booking terms',
        icon: 'file-text',
        isHidden: false,
        order: 3,
        subtopics: [
          {
            id: 'sub_turnaround',
            title: 'Turnaround Times & Delivery',
            description: 'When and how you receive your final gallery',
            order: 1,
            contentType: 'information',
            content: {
              information: {
                title: 'Photo Delivery Timeline',
                shortDescription: 'Standard turnaround is 10 business days for portraits and 3-4 weeks for weddings.',
                detailedContent: 'Portraits are ready in an online preview proofing gallery within 5 days. Once you select your favorite images for retouching, final high-resolution files are delivered within 5 additional business days. Weddings include sneak-peek photos within 48 hours and complete gallery delivery within 3-4 weeks.'
              }
            }
          },
          {
            id: 'sub_rescheduling',
            title: 'Rescheduling & Deposit Policy',
            description: 'Cancellation terms and inclement weather adjustments',
            order: 2,
            contentType: 'policy',
            content: {
              policy: {
                policyTitle: 'Booking Deposit & Rescheduling Rules',
                policyText: 'A non-refundable 25% deposit secures your date. In the event of illness or severe weather for outdoor sessions, clients may reschedule once with at least 48 hours notice without incurring a rebooking fee.',
                effectiveDate: '2026-01-01'
              }
            }
          }
        ]
      },
      {
        id: 'menu_delivery',
        title: 'Delivery & Print Ordering',
        description: 'Download formats, cloud backup, and print studio',
        icon: 'truck',
        isHidden: false,
        order: 4,
        subtopics: [
          {
            id: 'sub_digital_delivery',
            title: 'Digital Downloads & Licenses',
            description: 'High-resolution JPEG files with full personal print release',
            order: 1,
            contentType: 'faq',
            content: {
              faq: {
                question: 'Can I print my photos wherever I want?',
                approvedAnswer: 'Yes! Every delivered digital file includes a full personal print release. You can print them at any lab of your choice or order museum-grade archival prints directly through your private gallery.'
              }
            }
          }
        ]
      },
      {
        id: 'menu_talk_to_person',
        title: 'Custom Message — Talk to a Person',
        description: 'Leave a direct message for the studio team',
        icon: 'user',
        isHidden: false,
        order: 5,
        subtopics: [
          {
            id: 'sub_human_assist',
            title: 'Contact Studio Director',
            description: 'Have a bespoke request? Chat with our team',
            order: 1,
            contentType: 'human_assistance',
            content: {
              humanAssistance: {
                introductoryMessage: 'Our lead photographer and studio manager review every custom enquiry personally. Leave your note and preferred contact details below.',
                customerMessagePlaceholder: 'Tell us about your shoot date, venue, idea, or questions...',
                requireContactDetails: true,
                contactFields: ['name', 'email', 'phone'],
                handoffDestination: 'dashboard_inbox',
                confirmationBehavior: 'Our studio director will respond within 4 business hours.'
              }
            }
          }
        ]
      }
    ],
    defaultKnowledge: [
      {
        title: 'Studio Location & Hours',
        category: 'hours',
        type: 'text',
        content: 'The studio is located at 440 Artisan Way, Suite 200. Open Tuesday through Saturday from 9:00 AM to 6:00 PM by appointment only. Free dedicated parking is available in the rear lot.',
        tags: ['location', 'parking', 'hours']
      },
      {
        title: 'What to Wear to a Portrait Session',
        category: 'faq',
        type: 'faq',
        content: 'We recommend solid neutral or jewel-toned colors. Avoid small repetitive stripes, neon colors, and prominent logos. Bring 2 to 3 outfit options so the photographer can help select what photographs best with our backdrop setup.',
        tags: ['wardrobe', 'preparation', 'portraits']
      },
      {
        title: 'Payment Terms & Methods',
        category: 'pricing',
        type: 'policy',
        content: 'We accept all major credit cards, debit cards, bank ACH transfers, and Apple Pay. 25% due upon booking, remaining 75% due 48 hours before the shoot date.',
        tags: ['payment', 'deposit', 'credit cards']
      }
    ],
    defaultAiPrompt: 'You are the intelligent assistant for a boutique photography studio. Provide helpful, polite, and accurate information about sessions, packages, pricing, timelines, and wardrobe advice based on the studio knowledge base. If an enquiry requires bespoke scheduling or custom quotes, invite the user to select the "Talk to a Person" option.'
  },
  {
    id: 'restaurant',
    name: 'Restaurant & Café',
    industry: 'Restaurant & Hospitality',
    description: 'Perfect for dining establishments, cafés, and bistros with menus, allergy info, table reservations, and catering.',
    icon: 'utensils',
    defaultMenuItems: [
      {
        id: 'menu_food_prices',
        title: 'Menus & Prices',
        description: 'Explore lunch, dinner, drinks, and daily specials',
        icon: 'utensils',
        isHidden: false,
        order: 1,
        subtopics: [
          {
            id: 'sub_dinner_menu',
            title: 'Dinner Menu',
            description: 'House-made pasta, wood-fired mains, and appetizers',
            order: 1,
            contentType: 'information',
            content: {
              information: {
                title: 'Seasonal Dinner Offerings',
                shortDescription: 'Handcrafted Italian fare featuring locally sourced ingredients.',
                detailedContent: '• Truffle Tagliolini: Fresh egg pasta, cultured butter, shaved black winter truffle (R 280.00)\n• Bistecca Fiorentina: 32oz dry-aged porterhouse, rosemary sea salt, charred lemon (R 860.00)\n• Branzino al Forno: Whole roasted sea bass, wild fennel, salsa verde (R 360.00)\n• Burrata Pugliese: Heirloom tomato carpaccio, 12-year balsamic, basil crisp (R 190.00)'
              }
            }
          },
          {
            id: 'sub_specials',
            title: 'Chef Specials & Tasting Menu',
            description: 'Five-course tasting experience with wine pairing',
            order: 2,
            contentType: 'service_product',
            content: {
              serviceProduct: {
                name: 'Chef Tasting Menu (5 Courses)',
                description: 'A curated journey through regional Italian culinary traditions with optional sommelier pairings.',
                price: 'R 950.00 per person',
                pricingMethod: 'fixed',
                inclusions: [
                  'Amuse-bouche and house-baked rosemary focaccia',
                  'Antipasto, primo pasta, secondo meat/fish, and dolce',
                  'Dietary accommodations with 24h advance notice'
                ],
                exclusions: [
                  'Sommelier Wine Pairing (available for +R 550.00/guest)',
                  '10% service charge for parties of 6 or more'
                ],
                actionLabel: 'Reserve Tasting Table',
                linkedActionId: 'act_table_res'
              }
            }
          }
        ]
      },
      {
        id: 'menu_reservations',
        title: 'Table Reservations',
        description: 'Book indoor, terrace, or private dining tables',
        icon: 'calendar',
        isHidden: false,
        order: 2,
        subtopics: [
          {
            id: 'sub_book_table',
            title: 'Reserve a Table',
            description: 'Immediate booking for parties of 1 to 10 guests',
            order: 1,
            contentType: 'action',
            content: {
              action: {
                actionId: 'act_table_res',
                actionType: 'booking',
                title: 'Table Reservation Request',
                description: 'Let us know your preferred date, party size, and seating preference.',
                fields: [
                  { id: 'f_name', label: 'Guest Full Name', type: 'text', required: true, placeholder: 'e.g. Sofia Rossi' },
                  { id: 'f_phone', label: 'Phone Number (SMS confirmation)', type: 'phone', required: true, placeholder: '(082) 019-2834' },
                  { id: 'f_date', label: 'Reservation Date', type: 'date', required: true },
                  { id: 'f_time', label: 'Preferred Time', type: 'time', required: true },
                  { id: 'f_guests', label: 'Number of Guests', type: 'select', required: true, options: ['1-2 Guests', '3-4 Guests', '5-6 Guests', '7-8 Guests', 'Private Event (9+)'] },
                  { id: 'f_notes', label: 'Dietary Restrictions or Special Occasions', type: 'textarea', required: false, placeholder: 'e.g. Birthday anniversary, gluten intolerance...' }
                ],
                submitButtonText: 'Confirm Reservation Request',
                successMessage: 'Reservation submitted! Our host will send an SMS confirmation within 15 minutes.'
              }
            }
          }
        ]
      },
      {
        id: 'menu_allergies_policies',
        title: 'Policies & Dietary Information',
        description: 'Dress code, corkage fee, and allergen guidelines',
        icon: 'file-text',
        isHidden: false,
        order: 3,
        subtopics: [
          {
            id: 'sub_dietary',
            title: 'Allergen & Gluten-Free Guide',
            description: 'Nut-free, vegetarian, vegan, and celiac options',
            order: 1,
            contentType: 'faq',
            content: {
              faq: {
                question: 'Do you offer gluten-free pasta and vegetarian options?',
                approvedAnswer: 'Yes! We prepare fresh gluten-free penne and tagliatelle daily in a dedicated cook station. Over 40% of our menu items are vegetarian or can be adapted for plant-based diners.'
              }
            }
          },
          {
            id: 'sub_corkage',
            title: 'Corkage & Cake Cutting Policy',
            description: 'Bringing personal wine or celebratory desserts',
            order: 2,
            contentType: 'policy',
            content: {
              policy: {
                policyTitle: 'Corkage & Outside Food Policy',
                policyText: 'Corkage fee is R 120.00 per 750ml bottle, limited to two bottles per party. Outside celebratory cakes carry a R 45.00 per guest serving and plating fee.',
                effectiveDate: '2026-01-01'
              }
            }
          }
        ]
      },
      {
        id: 'menu_delivery_takeout',
        title: 'Delivery & Takeout',
        description: 'Direct online ordering and delivery partners',
        icon: 'truck',
        isHidden: false,
        order: 4,
        subtopics: [
          {
            id: 'sub_order_online',
            title: 'Order Direct for Curbside Pickup',
            description: 'Save 15% when ordering takeout directly from our kitchen',
            order: 1,
            contentType: 'external_link',
            content: {
              externalLink: {
                linkLabel: 'Open Online Takeout Menu',
                destinationUrl: 'https://toasttab.com/order-online',
                description: 'Hot, fresh pickup ready in 25 minutes with curbside parking spots #1-4.',
                openInNewTab: true
              }
            }
          }
        ]
      },
      {
        id: 'menu_speak_manager',
        title: 'Custom Message — Talk to a Person',
        description: 'Contact our floor manager or event coordinator',
        icon: 'user',
        isHidden: false,
        order: 5,
        subtopics: [
          {
            id: 'sub_manager_msg',
            title: 'Message Floor Manager',
            description: 'Private buyouts, party enquiries, or urgent questions',
            order: 1,
            contentType: 'human_assistance',
            content: {
              humanAssistance: {
                introductoryMessage: 'Need help with a large party, buyout, or special request? Send a message to our general manager directly.',
                customerMessagePlaceholder: 'How can our hospitality team assist you tonight?',
                requireContactDetails: true,
                contactFields: ['name', 'phone', 'email'],
                handoffDestination: 'dashboard_inbox',
                confirmationBehavior: 'Our on-duty manager monitors incoming messages continuously during dining service.'
              }
            }
          }
        ]
      }
    ],
    defaultKnowledge: [
      {
        title: 'Hours of Operation',
        category: 'hours',
        type: 'text',
        content: 'Lunch: Tuesday - Sunday, 11:30 AM to 2:30 PM. Dinner: Sunday - Thursday, 5:00 PM to 10:00 PM; Friday & Saturday, 5:00 PM to 11:00 PM. Closed Mondays.',
        tags: ['hours', 'schedule', 'lunch', 'dinner']
      },
      {
        title: 'Valet & Parking Information',
        category: 'general',
        type: 'text',
        content: 'Complimentary valet parking is available at our main entrance after 5:30 PM on Thursdays through Sundays. Street parking is available along Pine Street.',
        tags: ['parking', 'valet']
      }
    ],
    defaultAiPrompt: 'You are the digital concierge for an upscale Italian restaurant. Answer queries about opening hours, table bookings, dietary options, wine pairings, and parking courteously. Use the restaurant menus and policies strictly.'
  },
  {
    id: 'dealership',
    name: 'Automotive Dealership',
    industry: 'Automotive Dealership',
    description: 'Engineered for new & pre-owned vehicle sales, test drive scheduling, trade-in appraisals, and service center.',
    icon: 'car',
    defaultMenuItems: [
      {
        id: 'menu_inventory',
        title: 'Inventory & Pricing',
        description: 'Browse new arrivals, certified pre-owned, and electric vehicles',
        icon: 'car',
        isHidden: false,
        order: 1,
        subtopics: [
          {
            id: 'sub_new_inventory',
            title: 'Featured Electric & Hybrid Models',
            description: 'Latest 2026 sedans and performance SUVs',
            order: 1,
            contentType: 'service_product',
            content: {
              serviceProduct: {
                name: '2026 Meridian GT All-Wheel Drive',
                description: 'Dual-motor 420hp electric crossover with 340-mile EPA range, panoramic glass roof, and Level-2 autonomous highway assist.',
                price: 'R 854,800.00',
                pricingMethod: 'starting_at',
                inclusions: [
                  '3 years complimentary scheduled maintenance',
                  'Level 2 home wall charger with R 8,500.00 installation credit',
                  '8-year / 160,000-km battery & powertrain warranty'
                ],
                actionLabel: 'Schedule Test Drive',
                linkedActionId: 'act_test_drive'
              }
            }
          },
          {
            id: 'sub_cpo_models',
            title: 'Certified Pre-Owned Inventory',
            description: '160-point inspected vehicles with factory warranty',
            order: 2,
            contentType: 'information',
            content: {
              information: {
                title: 'Certified Pre-Owned Standards',
                shortDescription: 'Every CPO vehicle includes CARFAX 1-owner history and 12-month bumper-to-bumper extension.',
                detailedContent: 'Our current pre-owned inventory has 45 vehicles in stock ranging from R 218,900.00 to R 648,000.00. All vehicles pass stringent 160-point mechanical, electrical, and cosmetic certifications.'
              }
            }
          }
        ]
      },
      {
        id: 'menu_test_drive',
        title: 'Book a Test Drive',
        description: 'Pick your model, time, and test drive specialist',
        icon: 'calendar',
        isHidden: false,
        order: 2,
        subtopics: [
          {
            id: 'sub_schedule_td',
            title: 'Schedule In-Person Test Drive',
            description: 'No pressure, 30-minute demonstration on highway and city routes',
            order: 1,
            contentType: 'action',
            content: {
              action: {
                actionId: 'act_test_drive',
                actionType: 'booking',
                title: 'VIP Test Drive Booking',
                description: 'We will have the vehicle washed, charged/fueled, and waiting at our showroom entrance.',
                fields: [
                  { id: 'f_driver_name', label: 'Full Legal Name', type: 'text', required: true, placeholder: 'e.g. Marcus Vance' },
                  { id: 'f_driver_phone', label: 'Phone Number', type: 'phone', required: true, placeholder: '(083) 392-1084' },
                  { id: 'f_model', label: 'Vehicle Model of Interest', type: 'select', required: true, options: ['Meridian GT AWD', 'Horizon Sport Hybrid', 'Vanguard SUV', 'Certified Pre-Owned Sedan'] },
                  { id: 'f_td_date', label: 'Preferred Date', type: 'date', required: true },
                  { id: 'f_td_time', label: 'Preferred Time', type: 'time', required: true },
                  { id: 'f_trade', label: 'Do you have a trade-in vehicle?', type: 'select', required: false, options: ['Yes, want trade appraisal', 'No trade-in', 'Undecided'] }
                ],
                submitButtonText: 'Reserve Test Drive Slot',
                successMessage: 'Your test drive slot is locked! A sales advisor will text you vehicle key confirmation.'
              }
            }
          }
        ]
      },
      {
        id: 'menu_auto_policies',
        title: 'Financing & Trade-In Policies',
        description: 'Credit tiers, trade valuations, and return guarantee',
        icon: 'file-text',
        isHidden: false,
        order: 3,
        subtopics: [
          {
            id: 'sub_trade_policy',
            title: '7-Day Price Match & Trade Guarantee',
            description: 'Fair market appraisal policy and instant cash offers',
            order: 1,
            contentType: 'policy',
            content: {
              policy: {
                policyTitle: 'Kelly Blue Book Instant Cash Guarantee',
                policyText: 'We guarantee our trade-in offers for 7 days or 500 km. Bring any valid competitor offer and we will match or beat it by R 5,000.00.',
                effectiveDate: '2026-01-01'
              }
            }
          }
        ]
      },
      {
        id: 'menu_service_delivery',
        title: 'Home Delivery & Online Buying',
        description: 'Express checkout and driveway delivery within 50 km',
        icon: 'truck',
        isHidden: false,
        order: 4,
        subtopics: [
          {
            id: 'sub_driveway_deliv',
            title: 'Driveway Vehicle Delivery',
            description: 'Sign paperwork at home and receive your new car delivered to your door',
            order: 1,
            contentType: 'information',
            content: {
              information: {
                title: 'Complimentary 50-km Home Delivery',
                shortDescription: 'Complete your purchase 100% online in under 20 minutes.',
                detailedContent: 'Our delivery specialist brings your registered vehicle, license plates, and documents directly to your home or office. Take a 3-day / 200-km money-back trial.'
              }
            }
          }
        ]
      },
      {
        id: 'menu_auto_person',
        title: 'Custom Message — Talk to a Person',
        description: 'Connect with a senior sales consultant or master technician',
        icon: 'user',
        isHidden: false,
        order: 5,
        subtopics: [
          {
            id: 'sub_auto_human',
            title: 'Talk to Client Specialist',
            description: 'Inquire about fleet pricing, lease rates, or custom factory builds',
            order: 1,
            contentType: 'human_assistance',
            content: {
              humanAssistance: {
                introductoryMessage: 'Connect directly with our dealership product specialists for transparent price quotes and custom allocations.',
                customerMessagePlaceholder: 'Ask about vehicle availability, lease terms, or factory orders...',
                requireContactDetails: true,
                contactFields: ['name', 'phone', 'email'],
                handoffDestination: 'dashboard_inbox',
                confirmationBehavior: 'A certified product specialist will contact you via text or call within 30 minutes.'
              }
            }
          }
        ]
      }
    ],
    defaultKnowledge: [
      {
        title: 'Dealership & Service Hours',
        category: 'hours',
        type: 'text',
        content: 'Showroom: Monday - Saturday 9:00 AM - 6:00 PM, Sunday 10:00 AM - 3:00 PM. Service & Parts Center: Monday - Friday 7:30 AM - 5:30 PM, Saturday 8:00 AM - 1:00 PM.',
        tags: ['hours', 'showroom', 'service']
      },
      {
        title: 'Financing Prime Interest Rates',
        category: 'pricing',
        type: 'text',
        content: 'Competitive vehicle asset finance available through accredited South African banking partners at prime-linked interest rates.',
        tags: ['finance', 'prime', 'credit']
      }
    ],
    defaultAiPrompt: 'You are the knowledgeable dealership virtual advisor for an automotive showroom. Guide visitors through models, test drive bookings, financing basics, and warranty policies accurately.'
  },
  {
    id: 'beauty',
    name: 'Beauty Salon & Barbershop',
    industry: 'Beauty & Wellness',
    description: 'Tailored for hair salons, day spas, barbershops, and aesthetics clinics with appointment booking and stylist portfolios.',
    icon: 'scissors',
    defaultMenuItems: [
      {
        id: 'menu_beauty_services',
        title: 'Services & Prices',
        description: 'Cuts, coloring, styling, treatments, and aesthetics',
        icon: 'scissors',
        isHidden: false,
        order: 1,
        subtopics: [
          {
            id: 'sub_hair_services',
            title: 'Balayage & Color Mastery',
            description: 'Custom dimensional blonde, gloss toner, and bond repair',
            order: 1,
            contentType: 'service_product',
            content: {
              serviceProduct: {
                name: 'Custom Balayage & Glaze',
                description: 'Hand-painted dimensional highlighting tailored to your face shape, followed by custom acidic gloss and deep conditioning mask.',
                price: 'R 1,250.00',
                pricingMethod: 'starting_at',
                duration: '150 minutes',
                inclusions: [
                  'In-depth color consultation',
                  'Olaplex or K18 bond repair treatment',
                  'Custom gloss toner and blowout styling'
                ],
                actionLabel: 'Book Color Appointment',
                linkedActionId: 'act_beauty_book'
              }
            }
          },
          {
            id: 'sub_cut_style',
            title: 'Precision Cut & Blowout',
            description: 'Tailored haircutting, botanical scalp massage, and luxury blowout',
            order: 2,
            contentType: 'service_product',
            content: {
              serviceProduct: {
                name: 'Signature Cut & Luxury Blowout',
                description: 'Relaxing scalp detox with essential oils, precision wet & dry texturizing cut, and bouncy salon blowout.',
                price: 'R 380.00',
                pricingMethod: 'fixed',
                duration: '60 minutes',
                actionLabel: 'Book Haircut',
                linkedActionId: 'act_beauty_book'
              }
            }
          }
        ]
      },
      {
        id: 'menu_beauty_gallery',
        title: 'Portfolio & Transformations',
        description: 'Before & after transformations from our master stylists',
        icon: 'image',
        isHidden: false,
        order: 2,
        subtopics: [
          {
            id: 'sub_blonde_gallery',
            title: 'Blonde & Color Highlights',
            description: 'Sun-kissed honey, platinum, and lived-in blonde finishes',
            order: 1,
            contentType: 'gallery',
            content: {
              gallery: {
                galleryName: 'Lived-In Hair Transformations',
                images: [
                  { url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80', caption: 'Warm honey blonde balayage with face framing layers', category: 'Color' },
                  { url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80', caption: 'Glossy chocolate brunette with textured bob', category: 'Cuts' }
                ]
              }
            }
          }
        ]
      },
      {
        id: 'menu_beauty_policies',
        title: 'Policies & Cancellation',
        description: 'Booking deposit, late arrival window, and 24h cancellation rules',
        icon: 'file-text',
        isHidden: false,
        order: 3,
        subtopics: [
          {
            id: 'sub_cancel_policy',
            title: 'Cancellation & Late Arrival',
            description: 'Please notify us at least 24 hours prior to your slot',
            order: 1,
            contentType: 'policy',
            content: {
              policy: {
                policyTitle: '24-Hour Cancellation Policy',
                policyText: 'We kindly ask for 24 hours notice to cancel or reschedule appointments. Late cancellations or no-shows may be charged 50% of the scheduled service fee.',
                effectiveDate: '2026-01-01'
              }
            }
          }
        ]
      },
      {
        id: 'menu_beauty_products',
        title: 'Salon Care & Product Delivery',
        description: 'Purchase professional Kevin Murphy, K18, and Davines products',
        icon: 'truck',
        isHidden: false,
        order: 4,
        subtopics: [
          {
            id: 'sub_retail_products',
            title: 'Shop Home Haircare',
            description: 'Sulfate-free shampoos, purple toning masks, and heat protectants',
            order: 1,
            contentType: 'information',
            content: {
              information: {
                title: 'Curated Professional Hair Products',
                shortDescription: 'Maintain your color and hair health between appointments.',
                detailedContent: 'We carry full lines of K18 Molecular Hair Oil (R 650.00), Kevin Murphy Hydrate-Me Wash (R 380.00), and Davines OI All In One Milk (R 420.00). Curbside pickup or local courier delivery available.'
              }
            }
          }
        ]
      },
      {
        id: 'menu_beauty_person',
        title: 'Custom Message — Talk to a Person',
        description: 'Consult with our receptionist or request a specific stylist',
        icon: 'user',
        isHidden: false,
        order: 5,
        subtopics: [
          {
            id: 'sub_reception_assist',
            title: 'Message Salon Reception',
            description: 'Ask questions regarding service suitability, extensions, or group bridal bookings',
            order: 1,
            contentType: 'human_assistance',
            content: {
              humanAssistance: {
                introductoryMessage: 'Unsure which service is right for your hair length or texture? Send a message and our salon coordinator will assist you.',
                customerMessagePlaceholder: 'Describe your current hair and your hair goals...',
                requireContactDetails: true,
                contactFields: ['name', 'phone'],
                handoffDestination: 'dashboard_inbox',
                confirmationBehavior: 'Our front desk team responds promptly during salon operating hours.'
              }
            }
          }
        ]
      }
    ],
    defaultKnowledge: [
      {
        title: 'Salon Hours & Walk-In Policy',
        category: 'hours',
        type: 'text',
        content: 'Tuesday to Friday: 9:00 AM - 7:00 PM. Saturday: 9:00 AM - 5:00 PM. Sunday & Monday: Closed. Appointments are recommended; walk-ins are accommodated based on stylist availability.',
        tags: ['hours', 'walk-in', 'appointments']
      }
    ],
    defaultAiPrompt: 'You are the welcoming salon assistant. Answer questions on haircuts, hair color, treatments, appointments, and hair care products. Be encouraging, warm, and precise.'
  },
  {
    id: 'general',
    name: 'General Business Assistant',
    industry: 'Professional Services',
    description: 'A versatile starter template for legal, consulting, marketing, financial, and B2B service firms.',
    icon: 'briefcase',
    defaultMenuItems: [
      {
        id: 'menu_gen_services',
        title: 'Services & Prices',
        description: 'Consulting, project retainers, and advisory services',
        icon: 'briefcase',
        isHidden: false,
        order: 1,
        subtopics: [
          {
            id: 'sub_advisory',
            title: 'Strategic Advisory',
            description: 'One-on-one business growth and operational consulting',
            order: 1,
            contentType: 'service_product',
            content: {
              serviceProduct: {
                name: 'Executive Advisory Retainer',
                description: 'Bi-weekly executive steering sessions, ongoing asynchronous advisory, and audit roadmap.',
                price: 'R 15,000.00/mo',
                pricingMethod: 'starting_at',
                duration: 'Monthly recurring',
                inclusions: [
                  'Two 90-minute monthly strategic review calls',
                  'Dedicated Slack channel access with 24h response',
                  'Quarterly operational audit and benchmarking report'
                ],
                actionLabel: 'Schedule Discovery Call',
                linkedActionId: 'act_discovery_call'
              }
            }
          }
        ]
      },
      {
        id: 'menu_gen_portfolio',
        title: 'Portfolio & Case Studies',
        description: 'Demonstrated client results, metrics, and testimonials',
        icon: 'image',
        isHidden: false,
        order: 2,
        subtopics: [
          {
            id: 'sub_case_studies',
            title: 'Client Success Stories',
            description: 'Proven outcomes across B2B growth and digital transformation',
            order: 1,
            contentType: 'information',
            content: {
              information: {
                title: 'Featured Client Impact Case Studies',
                shortDescription: 'Real results delivered for emerging tech and enterprise clients.',
                detailedContent: '• FinTech Client: +140% Qualified Inbound Pipeline in 6 Months through revamped sales routing.\n• SaaS Scaleup: Reduced customer onboarding time from 14 days to 48 hours via automated workflow audits.'
              }
            }
          }
        ]
      },
      {
        id: 'menu_gen_policies',
        title: 'Policies & Information',
        description: 'Confidentiality, billing terms, and service agreements',
        icon: 'file-text',
        isHidden: false,
        order: 3,
        subtopics: [
          {
            id: 'sub_nda_policy',
            title: 'Non-Disclosure & Data Security',
            description: 'Strict mutual confidentiality and privacy safeguards',
            order: 1,
            contentType: 'policy',
            content: {
              policy: {
                policyTitle: 'Mutual Non-Disclosure & Security Standard',
                policyText: 'All client consultations and proprietary project data are guarded under strict mutual NDA standards. We never disclose client proprietary assets or business operational metrics.',
                effectiveDate: '2026-01-01'
              }
            }
          }
        ]
      },
      {
        id: 'menu_gen_delivery',
        title: 'Delivery & Milestones',
        description: 'How project deliverables and roadmaps are finalized',
        icon: 'truck',
        isHidden: false,
        order: 4,
        subtopics: [
          {
            id: 'sub_delivery_process',
            title: 'Project Delivery Framework',
            description: 'Agile sprints with weekly check-ins and shared Notion dashboards',
            order: 1,
            contentType: 'faq',
            content: {
              faq: {
                question: 'How do you keep clients updated on project progress?',
                approvedAnswer: 'We establish a dedicated client portal with transparent milestone tracking, weekly 20-minute standup summaries, and immediate asynchronous communication.'
              }
            }
          }
        ]
      },
      {
        id: 'menu_gen_person',
        title: 'Custom Message — Talk to a Person',
        description: 'Speak with our founding partner or project lead',
        icon: 'user',
        isHidden: false,
        order: 5,
        subtopics: [
          {
            id: 'sub_consult_person',
            title: 'Inquire Directly',
            description: 'Leave a brief summary of your organization and goals',
            order: 1,
            contentType: 'human_assistance',
            content: {
              humanAssistance: {
                introductoryMessage: 'Connect directly with our team. Leave your business requirements and we will review fit promptly.',
                customerMessagePlaceholder: 'Tell us about your business goals, timeline, and current hurdles...',
                requireContactDetails: true,
                contactFields: ['name', 'email', 'phone'],
                handoffDestination: 'dashboard_inbox',
                confirmationBehavior: 'A partner will review your enquiry and respond within 1 business day.'
              }
            }
          }
        ]
      }
    ],
    defaultKnowledge: [
      {
        title: 'Business Operating Hours',
        category: 'hours',
        type: 'text',
        content: 'Monday through Friday, 8:30 AM to 5:30 PM EST. Client support available 24/7 for urgent SLA incidents.',
        tags: ['hours', 'support', 'sla']
      }
    ],
    defaultAiPrompt: 'You are the intelligent business assistant for an executive advisory firm. Answer visitor questions professionally, explain service models, and direct qualified leads to discovery calls or the custom message form.'
  }
];

export function getTemplateById(templateId: string): TemplateDefinition {
  return STARTER_TEMPLATES.find((t) => t.id === templateId) || STARTER_TEMPLATES[0];
}
