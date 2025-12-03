const BASE_URL = 'https://source-newsletter.ghost.io'
const SITE_NAME = 'Custom'

const assetManifest = import.meta.glob('./images/**/*', { eager: true, import: 'default' }) as Record<string, string>

const asset = (file: string): string => {
  const key = `./images/${file}`
  const resolved = assetManifest[key]
  if (!resolved) {
    console.warn(`[preview-data] Missing asset for ${key}`)
    return ''
  }
  return resolved
}

type NavKey = 'home' | 'issues' | 'about'

const baseNavItems = [
  { key: 'home' as NavKey, label: 'Home', href: `${BASE_URL}/` },
  { key: 'issues' as NavKey, label: 'All issues', href: `${BASE_URL}/page/2/` },
  { key: 'about' as NavKey, label: 'About', href: `${BASE_URL}/about/` }
]

const baseMembersActions = {
  signin: { label: 'Sign in', href: '#/portal/signin' },
  signup: { label: 'Subscribe', href: '#/portal/signup' }
}

const baseSearchAction = {
  enabled: true,
  aria_label: 'Search this site'
}

const footerMenu = [
  { label: 'Advertise', href: `${BASE_URL}/` },
  { label: 'Sponsor', href: `${BASE_URL}/` },
  { label: 'Terms & conditions', href: `${BASE_URL}/` },
  { label: 'Data & privacy', href: `${BASE_URL}/` }
]

const footerSignup = {
  heading: 'Stay in the know',
  subhead: 'Sign up today and get all the latest tech updates from Technicolor',
  subscribe_form: {
    placeholder: 'jamie@example.com',
    button_label: 'Subscribe',
    action: 'subscribe',
    method: 'members',
    fields: [{ name: 'email', type: 'email', required: true }]
  }
}

const baseMeta = {
  generator: 'Ghost',
  theme: 'Source',
  portal_enabled: true,
  search_enabled: true
}

const baseAssets = {
  scripts: ['/assets/built/source.js?v=e985fa82ef']
}
const homeHero = {
  title: 'Reporting on ye olde mystical contraptions that doth shape our morrow',
  subscribe_form: footerSignup.subscribe_form
}

type SharedCard = {
  id: number
  title: string
  description: string
  date: string
  href: string
  feature_image?: string
  featured?: boolean
  feature_image_alt?: string
}

const sharedCardsSource: SharedCard[] = [
  {
    id: 1,
    title: 'Techne Most Virtuous: When Thy Gadgets Doth Pretend to Noble Deeds',
    description:
      "Hark! How these metal sprites and glowing rectangles doth claim to save thy world, whilst thou canst not even save thy scroll position. Verily, 'tis a comedy most divine when silicon prophets promise utopia!",
    date: '16 Aug 2023',
    href: '/when-thy-plastic-doth-multiply-like-rabbits/',
    feature_image: asset('posts/photo-01.png')
  },
  {
    id: 2,
    title: 'Crafting Digital Tapestries That Maketh Users Weep With Joy (Or Confusion)',
    description:
      'Forsooth! Learn ye the ancient art of making buttons that looketh not like buttons, and menus that hideth like cowardly knaves. Thy user experience shall be an adventure most perilous!',
    date: '09 Aug 2023',
    href: '/thy-remote-toil-doth-vex-the-merchants/',
    feature_image: asset('posts/photo-02.png')
  },
  {
    id: 3,
    title: 'Ye Olde Big Data: When Thy Numbers Groweth Beyond Mortal Comprehension',
    description:
      'Behold! How merchants doth divine thy deepest desires from thy clicking habits. Verily, they knoweth thou desirest socks ere thou knowest it thyself. A sorcery most invasive!',
    date: '02 Aug 2023',
    href: '/navigating-post-plague-marketplace-confusion/',
    feature_image: asset('posts/photo-03.png')
  },
  {
    id: 4,
    title: 'Green Techne Most Wondrous: When Thy Devices Pretendeth to Love Trees',
    description:
      'Hark! How these electric carriages and solar panels doth promise salvation, whilst thy phone battery lasteth not a single act of this play we call life. Irony most delicious!',
    date: '26 Jul 2023',
    href: '/when-thy-social-scrolls-doth-ruin-courtship/',
    feature_image: asset('posts/photo-04.png')
  },
  {
    id: 5,
    title: 'Rise of Augmented Visions: When Reality Itself Becometh Not Enough',
    description:
      'Lo! Now thy spectacles doth show dragons where pigeons sit, and gold where rubbish lies. Verily, we have solved problems that existed not, with solutions most complex!',
    date: '19 Jul 2023',
    href: '/planning-thy-cities-for-horses-that-fly-not/',
    feature_image: asset('posts/photo-05.png')
  },
  {
    id: 6,
    title: 'Mechanical Servants Rising: How Automatons Stealeth Thy Honest Labor',
    description:
      'Witness ye metal men who flip thy burgers and drive thy carriages! Soon they shall write thy sonnets too. What occupation remaineth for poor mortals? Mayhaps professional worrying!',
    date: '12 Jul 2023',
    href: '/when-thy-mind-doth-crack-in-thy-counting-house/',
    feature_image: asset('posts/photo-06.png')
  },
  {
    id: 7,
    title: 'Adorning Thy Pocket Oracle: Tricks to Make Thy Glowing Rectangle More Thine',
    description:
      "Prithee, learn to festoon thy digital familiar with widgets most useless and wallpapers most distracting. 'Tis the modern equivalent of bedazzling thy codpiece!",
    date: '05 Jul 2023',
    href: '/when-leeches-compete-with-crystals-for-thy-health/',
    feature_image: asset('posts/photo-07.png')
  },
  {
    id: 8,
    title: 'Digital Fasting: When Thou Must Flee Thy Glowing Masters',
    description:
      'Forsooth! Sometimes thou must abandon thy scrolling addiction and remember the sun exists. But fear not - thy FOMO shall guide thee back within the hour!',
    date: '28 Jun 2023',
    href: '/discovering-taverns-that-serve-not-ale-but-foam/',
    feature_image: asset('posts/photo-08.png')
  },
  {
    id: 9,
    title: 'Privacy Matters: How to Hide Thy Secrets From Thy Pocket Spy',
    description:
      "Verily, thy phone knoweth more of thee than thy mother! Learn ye the dark arts of confusing thy digital overlords, though 'tis likely futile as teaching Latin to a donkey!",
    date: '21 Jun 2023',
    href: '/when-windmills-finally-prove-useful/',
    feature_image: asset('posts/photo-09.png')
  },
  {
    id: 10,
    title: 'Ye Internet of Things: When Even Thy Toaster Demandeth WiFi',
    description:
      'Behold! Now thy refrigerator doth tweet and thy doorbell streameth video. Verily, we have given consciousness to objects that needed it not. What folly is this?',
    date: '14 Jun 2023',
    href: '/playing-god-with-thy-hereditary-scrolls/',
    feature_image: asset('posts/photo-10.png')
  },
  {
    id: 11,
    title: 'Gaming Evolution: From Humble Pixels to Realms Most Virtual',
    description:
      'Journey ye from when sprites were but squares, to now when thou canst feel dragon breath upon thy neck! Though thy back acheth the same from sitting too long.',
    date: '07 Jun 2023',
    href: '/when-thy-gold-turneth-to-numbers-on-screens/',
    feature_image: asset('posts/photo-11.png')
  },
  {
    id: 12,
    title: 'Space Techne: Fleeing Earth Before We Completely Ruin It',
    description:
      'Hark! Rich merchants now jousting with rockets, seeking new worlds to colonize! Mayhaps they should first master keeping thy website from crashing on Black Friday?',
    date: '31 May 2023',
    href: '/saving-creatures-in-lands-we-just-discovered-we-destroyed/',
    featured: true,
    feature_image: asset('posts/photo-12.png')
  }
];

const sharedCards = sharedCardsSource.map((card) => ({
  ...card,
  feature_image_alt: card.feature_image_alt ?? card.title
}));




const relatedCards = [
  {
    id: 1,
    title: 'Crafting Digital Tapestries That Maketh Users Weep With Joy (Or Confusion)',
    description:
      'Forsooth! Learn ye the ancient art of making buttons that looketh not like buttons, and menus that hideth like cowardly knaves. Thy user experience shall be an adventure most perilous!',
    date: '09 Aug 2023',
    datetime: '2023-08-09',
    href: '/thy-remote-toil-doth-vex-the-merchants/',
    image: asset('posts/photo-13.png')
  },
  {
    id: 2,
    title: 'Ye Olde Big Data: When Thy Numbers Groweth Beyond Mortal Comprehension',
    description:
      'Behold! How merchants doth divine thy deepest desires from thy clicking habits. Verily, they knoweth thou desirest socks ere thou knowest it thyself. A sorcery most invasive!',
    date: '02 Aug 2023',
    datetime: '2023-08-02',
    href: '/navigating-post-plague-marketplace-confusion/',
    image: asset('posts/photo-13.png')
  },
  {
    id: 3,
    title: 'Green Techne Most Wondrous: When Thy Devices Pretendeth to Love Trees',
    description:
      'Hark! How these electric carriages and solar panels doth promise salvation, whilst thy phone battery lasteth not a single act of this play we call life. Irony most delicious!',
    date: '26 Jul 2023',
    datetime: '2023-07-26',
    href: '/when-thy-social-scrolls-doth-ruin-courtship/',
    image: asset('posts/photo-13.png')
  },
  {
    id: 4,
    title: 'Rise of Augmented Visions: When Reality Itself Becometh Not Enough',
    description:
      'Lo! Now thy spectacles doth show dragons where pigeons sit, and gold where rubbish lies. Verily, we have solved problems that existed not, with solutions most complex!',
    date: '19 Jul 2023',
    datetime: '2023-07-19',
    href: '/planning-thy-cities-for-horses-that-fly-not/',
    image: asset('posts/photo-13.png')
  }
];


const postArticle = {
  tag: { name: 'Technology', href: `${BASE_URL}/tag/technology/` },
  title: 'Techne Most Virtuous: When Thy Gadgets Doth Pretend to Noble Deeds',
  excerpt:
    "Hark! How these metal sprites and glowing rectangles doth claim to save thy world, whilst thou canst not even save thy scroll position. Verily, 'tis a comedy most divine when silicon prophets promise utopia!",
  meta: {
    author: {
      name: 'Kelly Brown',
      href: '/author/kelly/',
      avatar: {
        src: asset('posts/photo-13.png'),
        alt: 'Kelly Brown'
      }
    },
    date: { display: '16 Aug 2023', datetime: '2023-08-16' },
    reading_time: '1 min read'
  },
  hero_image: {
    src: asset('posts/photo-13.png'),
    alt: 'Techne Most Virtuous: When Thy Gadgets Doth Pretend to Noble Deeds',
    srcset: [
      asset('posts/photo-13.png'),
      asset('posts/photo-13.png'),
      asset('posts/photo-13.png'),
      asset('posts/photo-13.png'),
      asset('posts/photo-13.png')
    ],
    sizes: '(max-width: 1200px) 100vw, 1120px'
  },
  content: [
    {
      type: 'paragraph',
      text: 'Maecenas consectetur pharetra nisi, vel congue ligula tempor quis. Sed turpis lorem, tempor varius pharetra pretium, varius at lorem. Nam viverra blandit massa id vehicula. Ut feugiat in erat vitae lacinia. Etiam tincidunt elit interdum, vitae porta lorem egestas lorem vitae eros vitae neque iaculis elementum.'
    },
    {
      type: 'paragraph',
      text: 'Etiam vestibulum scelerisque nisl in placerat. Curabitur ultrices quam et ligula congue, at bibendum arcu porttitor. Morbi lacinia pretium diam, hendrerit sagittis sem consectetur non. Proin vel nisi a turpis egestas efficitur. In semper velit non justo aliquam euismod.'
    },
    { type: 'heading', level: 2, id: 'sed-id-fermentum-neque', text: 'Sed id fermentum neque' },
    {
      type: 'paragraph',
      text: 'Proin tempus arcu vulputate pellentesque tempus. Nulla luctus dui id libero mattis luctus. Donec facilisis massa orci, et placerat purus pulvinar vel. Nullam egestas nisi ex, placerat imperdiet odio ullamcorper eu. Donec a aliquet nisl, sed pellentesque purus. Suspendisse eu nibh auctor, commodo elit vel, congue mi. Nulla nec nisl ligula. Pellentesque eleifend nibh nec augue aliquet efficitur.'
    },
    {
      type: 'image',
      src: asset('posts/photo-13.png'),
      alt: 'person holding silver samsung android smartphone',
      width: 2000,
      height: 2171,
      srcset: [
        asset('posts/photo-13.png'),
        asset('posts/photo-13.png'),
        asset('posts/photo-13.png'),
        asset('posts/photo-13.png')
      ],
      caption_html:
        'Photo by <a href="https://unsplash.com/@piqodesign?ref=source-newsletter.ghost.io">Piqo Design</a> / <a href="https://unsplash.com/?utm_source=ghost&amp;utm_medium=referral&amp;utm_campaign=api-credit">Unsplash</a>'
    },
    {
      type: 'paragraph',
      text: 'Sed elementum fermentum diam et suscipit. Quisque a facilisis sem. Nam accumsan lorem vitae elit interdum, vitae porta lorem egestas. Curabitur malesuada non quam vitae eleifend. Aliquam sem elit, rhoncus vel tristique ut, finibus ultrices augue. Suspendisse porta at nisl ac scelerisque. Cras sit amet tristique quam, nec eleifend dolor. Ut consequat purus risus, et pellentesque lectus scelerisque.'
    },
    {
      type: 'paragraph',
      text: 'Curabitur ultrices quam et ligula congue, at bibendum arcu porttitor. Morbi lacinia pretium diam, hendrerit sagittis sem consectetur non. Proin vel nisi a turpis egestas efficitur. In semper velit non justo aliquam euismod.'
    }
  ]
}

const publicationCoverImage = asset('publication-cover.jpg')

function buildSite() {
  return {
    name: SITE_NAME,
    base_url: BASE_URL,
    cover_image: publicationCoverImage
  }
}

function buildNavigationBar(active: NavKey | null) {
  return {
    brand: { text: SITE_NAME, href: BASE_URL },
    menu: baseNavItems.map((item) => ({
      label: item.label,
      href: item.href,
      current: active ? item.key === active : false
    })),
    actions: {
      search: { ...baseSearchAction },
      members: {
        signin: { ...baseMembersActions.signin },
        signup: { ...baseMembersActions.signup }
      }
    }
  }
}

function buildHeader(active: NavKey | null, hero?: typeof homeHero) {
  return {
    navigation_bar: buildNavigationBar(active),
    ...(hero ? { hero } : {})
  }
}

function buildFooter() {
  return {
    brand: SITE_NAME,
    menu: footerMenu.map((item) => ({ ...item })),
    powered_by: { label: 'Ghost', href: 'https://ghost.org/' },
    signup: {
      heading: footerSignup.heading,
      subhead: footerSignup.subhead,
      subscribe_form: {
        ...footerSignup.subscribe_form,
        fields: footerSignup.subscribe_form.fields.map((field) => ({ ...field }))
      }
    }
  }
}

export const previewHomeData = {
  site: buildSite(),
  header: buildHeader('home', homeHero),
  content: [
    {
      section: 'Latest',
      type: 'cards',
      cards: sharedCards,
      see_all_link: `${BASE_URL}/page/2`
    }
  ],
  footer: buildFooter(),
  assets: baseAssets,
  meta: baseMeta
}

export const previewAboutData = {
  site: buildSite(),
  header: buildHeader('about', homeHero),
  content: [
    {
      type: 'article',
      slug: '/about/',
      no_image: true,
      title: 'About this theme',
      sections: [
        {
          type: 'paragraph',
          text:
            "Source is the default theme in Ghost, and the easiest way to get started publishing content. As Ghost's default theme, Source no matter your style of writing, through a set of thoughtful style and personalization options."
        },
        { type: 'heading', level: 2, id: 'background-color', text: 'Background color' },
        {
          type: 'paragraph',
          text:
            'You can set any background color for your site. Once chosen, your text color will adapt automagically to optimize your content for readability ✨'
        },
        {
          type: 'gallery',
          width: 'wide',
          images: [
            {
              src: asset('about/about-01.png'),
              width: 2880,
              height: 1888,
              alt: '',
              style: 'flex: 1.52542 1 0%;'
            },
            {
              src: asset('about/about-02.png'),
              width: 2880,
              height: 1888,
              alt: '',
              style: 'flex: 1.52542 1 0%;'
            }
          ]
        },
        { type: 'heading', level: 2, id: 'typography', text: 'Typography' },
        {
          type: 'html',
          html:
            '<!--kg-card-begin: html-->\n<p>\n  Select from three different font styles —&nbsp;\n  <span style="font-family: var(--font-sans);font-size: 1.1em;font-weight: 550;line-height: 1.2;">modern sans-serif</span>,\n  <span style="font-family: var(--font-serif);font-size: 1.4em;font-weight: 500;line-height: 1;">elegant serif</span>&nbsp;and\n  <span style="font-family: var(--font-mono);font-size: 1.1em;font-weight: 500;line-height: 1;">consistent mono</span>.\n</p>\n<!--kg-card-end: html-->'
        },
        { type: 'heading', level: 2, id: 'homepage-header-styles', text: 'Homepage header styles' },
        {
          type: 'paragraph',
          text:
            'Source makes it as straightforward as possible to get started, by letting you choose from four unique homepage layouts that cover the most common use-cases we see.'
        },
        {
          type: 'paragraph',
          text:
            'Highlight and Magazine styles are perfect for content-rich publications, while Landing and Search are a more versatile choice for publications of all types – newsletters, blogs, docs, and more.'
        },
        { type: 'heading', level: 3, id: 'highlight', text: 'Highlight' },
        {
          type: 'image',
          href: 'https://source.ghost.io/?ref=source-newsletter.ghost.io',
          src: asset('about/about-03.png'),
          width: 2000,
          height: 1311,
          alt: '',
          caption_html: '<span style="white-space: pre-wrap;">The Highlight layout</span>'
        },
        { type: 'heading', level: 3, id: 'magazine', text: 'Magazine' },
        {
          type: 'image',
          href: 'https://source-magazine.ghost.io/?ref=source-newsletter.ghost.io',
          src: asset('about/about-04.png'),
          width: 2000,
          height: 1311,
          alt: '',
          caption_html: '<span style="white-space: pre-wrap;">The Magazine layout</span>'
        },
        { type: 'heading', level: 3, id: 'landing-search', text: 'Landing & Search' },
        {
          type: 'image',
          href: 'https://source-newsletter.ghost.io/',
          src: asset('about/about-01.png'),
          width: 2000,
          height: 1269,
          alt: '',
          caption_html: '<span style="white-space: pre-wrap;">The Landing layout</span>'
        },
        { type: 'heading', level: 2, id: 'post-feed-styles', text: 'Post feed styles' },
        {
          type: 'paragraph',
          text:
            "Ensure readers view and experience your content archive the way you'd like them to, whether it's a classic list layout or a visually rich grid."
        },
        { type: 'heading', level: 3, id: 'list', text: 'List' },
        {
          type: 'image',
          src: asset('about/about-02.png'),
          width: 2000,
          height: 1281,
          alt: 'List layout preview'
        },
        { type: 'heading', level: 3, id: 'grid', text: 'Grid' },
        {
          type: 'image',
          src: asset('about/about-03.png'),
          width: 2000,
          height: 1281,
          alt: 'Grid layout preview'
        }
      ]
    }
  ],
  footer: buildFooter(),
  assets: baseAssets,
  meta: baseMeta
}

const pageTwoCards = sharedCards.map((card) => ({ ...card }))

export const previewPageTwoData = {
  site: buildSite(),
  header: buildHeader('issues'),
  content: [
    {
      section: 'Latest',
      type: 'cards',
      cards: [
        ...pageTwoCards,
        {
          id: 13,
          title: 'What Thou Shouldst Know About Thy Next-Gen Witchcraft Network',
          description:
            'Forsooth! This "5G" sorcery promises speeds that maketh lightning seem slothful. Yet still thy video call freezeth when thou needest it most. O cruel irony of progress!',
          date: '24 May 2023',
          href: '/when-wax-cylinders-make-triumphant-return/',
          tag: 'Technology',
          featured: true,
          feature_image: asset('posts/photo-13.png'),
          feature_image_alt: 'What Thou Shouldst Know About Thy Next-Gen Witchcraft Network'
        },
        {
          id: 14,
          title: 'Wearable Wonders: Trinkets That Counteth Thy Steps Unto Madness',
          description:
            'Behold! Now thy wrist doth scold thee for sitting too long, and thy ring knoweth when thou sleepest poorly. Verily, we have invented nagging jewelry. What times are these!',
          date: '17 May 2023',
          href: '/when-thy-supply-wagons-get-lost-at-sea-digitally/',
          tag: 'Technology',
          featured: true,
          feature_image: asset('posts/photo-14.png'),
          feature_image_alt: 'Wearable Wonders: Trinkets That Counteth Thy Steps Unto Madness'
        },
        {
          id: 15,
          title: 'Fashion Meets Techne: When Thy Codpiece Connecteth to WiFi',
          description:
            'Lo! Now thy garments flash with lights and buzz with notifications. Thou canst not escape thy emails even whilst naked. Fashion hath betrayed us most grievously!',
          date: '10 May 2023',
          href: '/exploring-diverse-tapestries-through-finger-paintings/',
          tag: 'Technology',
          featured: true,
          feature_image: asset('posts/photo-09.png'),
          feature_image_alt: 'Fashion Meets Techne: When Thy Codpiece Connecteth to WiFi'
        },
        {
          id: 16,
          title: 'Future of Wearable Illusions: When Thy Spectacles Lie Most Convincingly',
          description:
            'Hark! Soon thy glasses shall overlay advertisements upon the very sky! Escape not capitalism even in thy dreams. The future is here, and it wants thy gold!',
          date: '03 May 2023',
          href: '/when-imaginary-coins-topple-real-kingdoms/',
          tag: 'Technology',
          featured: true,
          feature_image: asset('posts/photo-10.png'),
          feature_image_alt: 'Future of Wearable Illusions: When Thy Spectacles Lie Most Convincingly'
        },
        {
          id: 17,
          title: 'Thy Smart Dwelling Revolution: When Thy Chamber Pot Needeth Updates',
          description:
            'Witness! Thy humble abode now requireth more passwords than a royal treasury. Even thy light bulbs demand firmware updates. Simplicity died; we murdered it with apps!',
          date: '26 Apr 2023',
          href: '/when-thy-physician-appears-as-moving-picture/',
          tag: 'Technology',
          featured: true,
          feature_image: asset('posts/photo-11.png'),
          feature_image_alt: 'Thy Smart Dwelling Revolution: When Thy Chamber Pot Needeth Updates'
        }
      ],
      see_all_link: `${BASE_URL}/page/2`
    }
  ],
  footer: buildFooter(),
  assets: baseAssets,
  meta: baseMeta
}

export const previewPostData = {
  site: buildSite(),
  header: buildHeader(null),
  article: postArticle,
  related: {
    section: 'Read more',
    cards: relatedCards
  },
  content: [],
  footer: buildFooter(),
  assets: baseAssets,
  meta: baseMeta
}

export type PreviewData = typeof previewHomeData

export default previewHomeData
