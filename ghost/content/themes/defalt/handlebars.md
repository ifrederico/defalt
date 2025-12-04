# Ghost Handlebars Reference

Quick reference for Ghost theme development with Handlebars.

## Key Rules

### Parameters
- ✅ Treat most helper/partial params as strings: `limit="5"`, `filter="tag:hash-news,featured:true"`
- ✅ Use `@custom` settings for real booleans: `{{#if @custom.show_featured}}...{{/if}}`
- Prefer CSS classes/vars for UI toggles instead of passing flags around

### Widths
- **720px** - Narrow (content width)
- **1120px** - Default (article/post width)
- **1320px** - Wide (full container width)

### Classes
- `gh-outer` - Outer container with padding
- `gh-inner` - Inner container with max-width
- `gh-canvas` - Content canvas
- `gh-article` - Article container
- `gh-content` - Content wrapper
- `is-title` - Title typography
- `is-body` - Body typography
- `gd-*` - Custom "Ghost Defalt" classes

## Functional Helpers

### Required layout hooks
- `{{ghost_head}}` in `<head>`
- `{{ghost_foot}}` before `</body>`

### foreach
Loop over collections (posts, pages, tags, etc.)

```handlebars
{{!-- Basic loop --}}
{{#foreach posts}}
  <div>{{title}}</div>
{{/foreach}}

{{!-- With limit --}}
{{#foreach posts limit="3"}}
  <div>{{title}}</div>
{{/foreach}}

{{!-- With data variables --}}
{{#foreach posts}}
  <div class="post-{{@number}}">
    {{#if @first}}<span>First!</span>{{/if}}
    {{title}}
    {{#if @last}}<span>Last!</span>{{/if}}
  </div>
{{/foreach}}

{{!-- With else block --}}
{{#foreach tags}}
  <a href="{{url}}">{{name}}</a>
{{else}}
  <p>No tags found</p>
{{/foreach}}

{{!-- With block parameters --}}
{{#foreach posts as |post|}}
  <div>{{post.title}}</div>
{{/foreach}}

{{!-- With visibility filter (for tags) --}}
{{#foreach tags visibility="all"}}
  {{name}} - {{description}}
{{/foreach}}

{{!-- Only internal tags --}}
{{#foreach tags visibility="internal"}}
  {{name}}
{{/foreach}}
```

**Visibility attribute (tags only):**
- `"public"` - Only public tags (default)
- `"internal"` - Only internal tags (those starting with `#`)
- `"all"` - Both public and internal tags

**Data variables:**
- `@index` - Zero-based index
- `@number` - One-based index
- `@first` - True for first item
- `@last` - True for last item
- `@key` - Object key (if iterating object)

### get
Fetch data with custom queries

```handlebars
{{!-- Get posts --}}
{{#get "posts" limit="5"}}
  {{#foreach posts}}
    {{title}}
  {{/foreach}}
{{/get}}

{{!-- Get pages with filter --}}
{{#get "pages" filter="tag:hash-featured"}}
  {{#if pages}}
    {{#foreach pages}}
      {{title}}
    {{/foreach}}
  {{/if}}
{{/get}}

{{!-- With multiple filters --}}
{{#get "posts" filter="featured:true+tag:news" limit="3"}}
  {{#foreach posts}}
    {{title}}
  {{/foreach}}
{{/get}}

{{!-- With block parameters --}}
{{#get "posts" filter="featured:true" as |featured|}}
  {{#foreach featured}}
    {{title}}
  {{/foreach}}
{{/get}}

{{!-- Include related data --}}
{{#get "posts" include="tags,authors"}}
  {{#foreach posts}}
    {{title}} by {{primary_author.name}}
  {{/foreach}}
{{/get}}
```

**get parameters:**
- `limit` - Number of items (default: 15, use `limit="all"` for everything)
- `filter` - NQL filter expression
- `include` - Include related data (tags, authors, etc.)
- `order` - Sort order (e.g., "published_at DESC")
- `page` - Page number for pagination in custom queries

**get resources:** `"posts"`, `"pages"`, `"tags"`, `"authors"`, `"tiers"`

### if / unless
Conditionals

```handlebars
{{!-- if --}}
{{#if featured}}
  <span class="badge">Featured</span>
{{/if}}

{{!-- if/else --}}
{{#if feature_image}}
  <img src="{{feature_image}}" alt="{{title}}">
{{else}}
  <img src="{{asset "img/default.jpg"}}" alt="Default">
{{/if}}

{{!-- unless (inverse of if) --}}
{{#unless featured}}
  <span>Not featured</span>
{{/unless}}
```

**Falsy values:**
- `false`, `0`, `undefined`, `null`, `""`, `[]`

### match
Compare values

```handlebars
{{!-- Equality --}}
{{#match @custom.header_style "=" "Classic"}}
  Show classic header
{{/match}}

{{!-- Not equal --}}
{{#match @custom.header_style "!=" "Highlight"}}
  Show non-highlight content
{{/match}}

{{!-- Inline usage --}}
<div {{#match @custom.color_scheme "=" "Dark"}}class="dark-mode"{{/match}}>
  Content
</div>
```

### has
Check for presence of tags, authors, etc.

```handlebars
{{!-- Check for specific tag --}}
{{#has tag="news"}}
  <span class="badge">News</span>
{{/has}}

{{!-- Check for any tag --}}
{{#has tag="featured,breaking"}}
  <span>Important</span>
{{/has}}

{{!-- Check for author --}}
{{#has author="john"}}
  Written by John
{{/has}}
```
- Comma = OR, plus = AND (e.g. `tag="featured+breaking"`)

### is
Check context/route

```handlebars
{{!-- Check if home page --}}
{{#is "home"}}
  <h1>Welcome Home</h1>
{{/is}}

{{!-- Check if post page --}}
{{#is "post"}}
  <article>Post content</article>
{{/is}}

{{!-- Check multiple contexts --}}
{{#is "home, page"}}
  Show on home or page
{{/is}}
```

### body_class / post_class
Dynamic classes for styling hooks

```handlebars
{{!-- In default.hbs --}}
<body class="{{body_class}}">

{{!-- Outputs classes like: home-template, post-template, page-template, tag-template --}}
{{!-- Also includes: tag-{slug}, author-{slug}, private-template --}}

{{!-- In post.hbs --}}
<article class="{{post_class}}">

{{!-- Outputs classes like: post, featured, page, tag-{slug} --}}
```

### plural
Pluralization helper

```handlebars
{{plural ../pagination.total empty="No posts" singular="% post" plural="% posts"}}
{{!-- Outputs: "No posts", "1 post", or "5 posts" --}}

{{plural comments.length empty="No comments" singular="1 comment" plural="% comments"}}
```

### encode
URL encoding for share links

```handlebars
<a href="https://twitter.com/intent/tweet?url={{encode url}}&text={{encode title}}">
  Share on Twitter
</a>

<a href="https://www.facebook.com/sharer/sharer.php?u={{encode url}}">
  Share on Facebook
</a>
```

### concat
String concatenation

```handlebars
{{concat "Hello" " " "World"}}  {{!-- "Hello World" --}}

{{!-- Useful for building dynamic values --}}
<div class="{{concat "post-" slug}}">
```

### link / link_class
Generate links with active states

```handlebars
{{!-- Automatic active class when on that page --}}
{{#link href="/"}}Home{{/link}}
{{#link href="/about/"}}About{{/link}}

{{!-- With custom class --}}
{{#link href="/contact/" class="nav-item"}}Contact{{/link}}

{{!-- link_class for manual links --}}
<a href="/" class="{{link_class for="/"}}">Home</a>
```

### comment_count / comments
Native comments (Ghost 5+)

```handlebars
{{!-- Show comment count --}}
{{comment_count}}  {{!-- Outputs: "0 comments", "1 comment", "5 comments" --}}

{{!-- Embed comments section --}}
{{comments}}
```

## Data Helpers

### date / reading_time / price / t
```handlebars
{{date published_at format="MMMM D, YYYY"}}
{{date published_at timeago=true}}      {{!-- "3 days ago" --}}
{{reading_time}}                        {{!-- "4 min read" --}}
{{price @price}}                        {{!-- Smart currency formatting --}}
{{price 500 currency="EUR"}}            {{!-- 5.00 € --}}
{{t "Read more"}}                       {{!-- Translate strings --}}
{{t "Posted in {tag}" tag="<a href=\"{{url}}\">{{name}}</a>"}}  {{!-- Interpolation --}}
```

### img_url
Generate responsive image URLs

```handlebars
{{!-- Single size --}}
{{img_url feature_image size="m"}}

{{!-- Responsive srcset --}}
<img srcset="{{img_url feature_image size="s"}} 320w,
             {{img_url feature_image size="m"}} 600w,
             {{img_url feature_image size="l"}} 960w,
             {{img_url feature_image size="xl"}} 1200w,
             {{img_url feature_image size="xxl"}} 2000w"
     sizes="(max-width: 1200px) 100vw, 1120px"
     src="{{img_url feature_image size="xl"}}"
     alt="{{title}}" />
```

**Sizes:** `xs` (100w), `s` (320w), `m` (600w), `l` (960w), `xl` (1200w), `xxl` (2000w), plus `w500`, `w1000`, etc.

### asset
Link to theme assets

```handlebars
<link rel="stylesheet" href="{{asset "css/screen.css"}}" />
<script src="{{asset "js/main.js"}}"></script>
<img src="{{asset "img/logo.png"}}" alt="Logo" />
```

### Content Variables
```handlebars
{{title}}                   {{!-- Page/post title --}}
{{slug}}                    {{!-- URL slug --}}
{{id}}                      {{!-- Unique ID --}}
{{uuid}}                    {{!-- Public UUID for API --}}
{{custom_excerpt}}          {{!-- Custom excerpt --}}
{{excerpt}}                 {{!-- Auto-generated excerpt (300–500 chars, may cut mid-sentence) --}}
{{content}}                 {{!-- Preferred helper for post/page content --}}
{{html}}                    {{!-- Legacy alias in some themes --}}
{{url}}                     {{!-- Page/post URL --}}
{{canonical_url}}           {{!-- Canonical URL (if set) --}}
{{feature_image}}           {{!-- Featured image URL --}}
{{feature_image_alt}}       {{!-- Alt text --}}
{{feature_image_caption}}   {{!-- Caption --}}
{{published_at}}            {{!-- Published date --}}
{{updated_at}}              {{!-- Updated date --}}
{{created_at}}              {{!-- Created date --}}
{{featured}}                {{!-- Boolean: is featured --}}
{{visibility}}              {{!-- Access level: public, members, paid, tiers --}}
{{access}}                  {{!-- Boolean: can current visitor access full content --}}
{{comments}}                {{!-- Boolean: comments enabled for this post --}}
{{comment_id}}              {{!-- Comment identifier --}}
{{tags}}                    {{!-- Array of tags --}}
{{primary_tag}}             {{!-- Primary tag object --}}
{{authors}}                 {{!-- Array of authors --}}
{{primary_author}}          {{!-- Primary author object --}}
```

### Author Variables
```handlebars
{{name}}                    {{!-- Author name --}}
{{slug}}                    {{!-- Author slug --}}
{{bio}}                     {{!-- Author bio --}}
{{location}}                {{!-- Author location --}}
{{website}}                 {{!-- Author website URL --}}
{{profile_image}}           {{!-- Author profile image --}}
{{cover_image}}             {{!-- Author cover image --}}
{{twitter}}                 {{!-- Twitter handle --}}
{{facebook}}                {{!-- Facebook username --}}
{{meta_title}}              {{!-- SEO title --}}
{{meta_description}}        {{!-- SEO description --}}
```

### Tag Variables
```handlebars
{{name}}                    {{!-- Tag name --}}
{{slug}}                    {{!-- Tag slug --}}
{{description}}             {{!-- Tag description --}}
{{feature_image}}           {{!-- Tag feature image --}}
{{meta_title}}              {{!-- SEO title --}}
{{meta_description}}        {{!-- SEO description --}}
{{visibility}}              {{!-- public or internal --}}
```

### Global Variables
```handlebars
@site.title                 {{!-- Site title --}}
@site.description           {{!-- Site description --}}
@site.url                   {{!-- Site URL --}}
@site.logo                  {{!-- Site logo URL --}}
@site.cover_image           {{!-- Site cover image --}}
@site.icon                  {{!-- Site icon/favicon --}}
@site.lang                  {{!-- Site language code (e.g., "en") --}}
@site.timezone              {{!-- Site timezone --}}
@site.twitter               {{!-- Twitter handle --}}
@site.facebook              {{!-- Facebook URL --}}
@site.navigation            {{!-- Primary navigation array --}}
@site.secondary_navigation  {{!-- Secondary navigation array --}}
@site.members_enabled       {{!-- Boolean: membership enabled --}}
@site.paid_members_enabled  {{!-- Boolean: paid tiers enabled --}}
@site.members_invite_only   {{!-- Boolean: invite-only mode --}}
@site.accent_color          {{!-- Accent color hex value --}}
@custom.setting_name        {{!-- Custom theme settings --}}
```

**Popular `@custom` options (Defalt/Casper-like themes):** `@custom.header_style`, `@custom.navigation_layout`, `@custom.color_scheme`, `@custom.body_font`, `@custom.heading_font`, `@custom.show_publication_cover_on_homepage`

## Membership & Access Control

### Member Variables
```handlebars
{{#if @member}}                     {{!-- Logged-in member --}}
  Welcome, {{@member.name}}!
  Email: {{@member.email}}
  {{#if @member.paid}}              {{!-- Paid subscriber --}}
    Thanks for subscribing!
  {{/if}}
{{else}}
  <a href="#/portal/signin">Sign in</a>
{{/if}}

{{!-- Member properties --}}
@member.uuid                        {{!-- Member UUID --}}
@member.email                       {{!-- Member email --}}
@member.name                        {{!-- Member name --}}
@member.firstname                   {{!-- First name --}}
@member.paid                        {{!-- Boolean: has active paid subscription --}}
@member.subscriptions               {{!-- Array of subscription objects --}}
```

### Content Gating
```handlebars
{{!-- Check if visitor can access content --}}
{{#if access}}
  {{content}}
{{else}}
  <p>This content is for {{visibility}} only.</p>
  {{#if @member}}
    <a href="#/portal/account">Upgrade</a>
  {{else}}
    <a href="#/portal/signup">Subscribe</a>
  {{/if}}
{{/if}}

{{!-- Check visibility level --}}
{{#match visibility "=" "paid"}}
  <span class="badge">Premium</span>
{{/match}}
```

### Tiers Helper
```handlebars
{{!-- List available tiers --}}
{{#get "tiers" limit="all" include="monthly_price,yearly_price"}}
  {{#foreach tiers}}
    <div class="tier">
      <h3>{{name}}</h3>
      <p>{{description}}</p>
      {{#if monthly_price}}
        <span>{{price monthly_price currency=currency}}/month</span>
      {{/if}}
    </div>
  {{/foreach}}
{{/get}}

{{!-- Member counts (in footer, etc.) --}}
{{total_members}}                   {{!-- Total free + paid members --}}
{{total_paid_members}}              {{!-- Paid members only --}}
```

### Portal Links
```handlebars
{{!-- Sign in/up links --}}
<a href="#/portal/signin">Sign in</a>
<a href="#/portal/signup">Sign up</a>
<a href="#/portal/account">Account</a>
<a href="#/portal/account/plans">Change plan</a>

{{!-- Direct tier signup --}}
<a href="#/portal/signup/{{tier.id}}">Subscribe to {{tier.name}}</a>
```

## Section Template Pattern

```handlebars
{{!-- Description and parameters --}}

<style>
.my-section {
    /* CONFIGURATION */
    --section-width: 1120px;  /* 720px, 1120px, or 1320px */
    --section-padding-top: 64px;
    --section-padding-bottom: 0px;

    padding-top: var(--section-padding-top);
    padding-bottom: var(--section-padding-bottom);
}

.my-section .gh-inner {
    max-width: var(--section-width);
}

.my-section:first-of-type {
    --section-padding-top: max(4vw, 40px);
}
</style>

{{!-- Parent usage: {{> "sections/my-section" filter="tag:hash-ghost-card"}} --}}

{{#get "pages" filter=filter}}
  {{#if pages}}
    <section class="my-section gh-outer">
      <div class="gh-inner">
        {{#foreach pages}}
          <article>
            <header>
              <h1 class="is-title">{{title}}</h1>
              {{#if custom_excerpt}}
                <p class="is-body">{{custom_excerpt}}</p>
              {{/if}}
              {{> "feature-image"}}
            </header>
            <div class="gh-content is-body">
              {{content}}
            </div>
          </article>
        {{/foreach}}
      </div>
    </section>
  {{/if}}
{{/get}}
```

## Pagination & Navigation

```handlebars
{{#if pagination.pages}}
  {{pagination}}
{{/if}}

{{!-- Manual pagination --}}
{{#if pagination.prev}}<a href="{{pagination.prev}}">← Newer</a>{{/if}}
{{#if pagination.next}}<a href="{{pagination.next}}">Older →</a>{{/if}}

{{navigation}}
{{navigation type="secondary"}}

{{!-- Manual navigation --}}
{{#foreach navigation}}
  <a href="{{url}}" {{#if current}}class="active"{{/if}}>{{label}}</a>
{{/foreach}}
```

## contentFor / block pattern (Ghost 5+)

```handlebars
{{#contentFor "body_class"}}
  {{#is "post"}}single-post{{/is}}
  {{#is "home"}}home-page{{/is}}
{{/contentFor}}

{{#contentFor "meta_title"}}
  {{#is "post"}}{{title}} – {{@site.title}}{{else}}{{title}}{{/is}}
{{/contentFor}}
```

## Feature image snippet (responsive one-liner)

```handlebars
{{#if feature_image}}
  <img class="gh-feature-image"
       srcset="{{img_url feature_image size="s"}} 320w,
               {{img_url feature_image size="m"}} 600w,
               {{img_url feature_image size="l"}} 960w,
               {{img_url feature_image size="xl"}} 1200w,
               {{img_url feature_image size="xxl"}} 2000w"
       sizes="(max-width: 1000px) 100vw, 1000px"
       src="{{img_url feature_image size="l"}}"
       alt="{{feature_image_alt}}">
{{/if}}
```

## Template Files

### Required Files
```
package.json          # Theme metadata and config
index.hbs             # Post list / home fallback
post.hbs              # Single post
default.hbs           # Base layout wrapper
```

### Optional Template Files
```
home.hbs              # Homepage (falls back to index.hbs)
page.hbs              # Static pages
page-{slug}.hbs       # Specific page by slug (e.g., page-about.hbs)
custom-{name}.hbs     # Custom templates selectable in admin
tag.hbs               # Tag archive
tag-{slug}.hbs        # Specific tag (e.g., tag-news.hbs)
author.hbs            # Author archive
author-{slug}.hbs     # Specific author
error.hbs             # Generic error page
error-404.hbs         # 404 page
```

### Partials Directory
```
partials/
  ├── header.hbs      # {{> "header"}}
  ├── footer.hbs      # {{> "footer"}}
  ├── post-card.hbs   # {{> "post-card"}}
  └── icons/          # {{> "icons/arrow"}}
        └── arrow.hbs
```

### Template Hierarchy (lookup order)
- `home.hbs → index.hbs`
- `post.hbs → default.hbs`
- `page-:slug.hbs → custom-*.hbs (if chosen) → page.hbs → post.hbs → default.hbs`
- `tag-:slug.hbs → tag.hbs → index.hbs`
- `author-:slug.hbs → author.hbs → index.hbs`
- `error-404.hbs → error.hbs → default.hbs`

## Common Issues

**Helper parameters are stringy**
- Pass params as strings; use `@custom` booleans with `if/match`
- Prefer CSS classes/vars for UI toggles over helper flags

**Image not showing**
- Check `{{#if feature_image}}`
- Make sure page has featured image in Ghost Admin

**Width too wide/narrow**
- Use Ghost's standard widths: 720px, 1120px, 1320px
- Use `gh-inner` class with CSS variable for max-width

**Content not appearing**
- Check if pages exist with the tag
- Make sure tag is internal (starts with #)
- Verify `{{#if pages}}` conditional

**foreach not iterating**
- Make sure you're inside a `{{#get}}` block with results
- Check that the collection has items

**Filter not working**
- Use NQL syntax: `tag:name`, `featured:true`, `author:slug`
- Combine with `+` (AND) or `,` (OR)
- Internal tags need `hash-` prefix: `tag:hash-ghost-card`

## References

- [Ghost Handlebars Helpers Documentation](https://docs.ghost.org/themes/helpers/)
- [Ghost foreach Helper](https://ghost.org/docs/themes/helpers/foreach/)
- [Ghost get Helper](https://ghost.org/docs/themes/helpers/get/)
- [Ghost Theme Development Guide](https://www.christhefreelancer.com/ghost-theme-development-guide/)
