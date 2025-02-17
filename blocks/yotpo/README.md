# Yotpo Reviews

Yotpo Review block for Adobe Commerce Storefront

* [Yotpo Reviews Installation Guide](https://support.yotpo.com/docs/generic-other-platforms-installing-yotpo-reviews-v3)
* [Yotpo Dashoard](https://reviews.yotpo.com/#/home)
* [View Demo](https://main--showcase-evergreen-commerce-storefront--blueacorninc.hlx.live/yotpo)

## Technical Approach

This approach is intended for Adobe Commerce Storefront with document based authoring. When a customer wants to render a Yotpo Reviews block, they will add a table to the doc with a header row containing "Yotpo". [View Example](https://docs.google.com/document/d/1zUt26xPAzziRJBb_YsyVht3DU0xmRVTDXc7rgmhrxtI/edit?tab=t.0). 


When Helix renders this page, it will parse the table and run the `yotpo.js` in this directory. This file will add the needed script tags to enable Yotpo, and inject the needed `<div>` tag into the block allowing Yotpo to present. 

As a result, Yotpo can be easily integrated into the storefront wherever a merchant wants to display it. See it in action [here](https://main--showcase-evergreen-commerce-storefront--blueacorninc.hlx.live/yotpo).

## Block Options

This Adobe Commerce Blocks can be configured within the document-based authoring context by adding optins to the block table within the doc. 

| Key   | Value |
|-------|-------|
|       |       |

## Block Setup in Configs

To use this block, configure the following in the `configs` sheet.

| Path                | Value                                                                                   |
|---------------------|-----------------------------------------------------------------------------------------|
| yotpo.instance-id   | https://cdn-widgetsrepository.yotpo.com/v1/loader/2DscstHDudRbdPAOzC5foy1bLIBMZjhtyDjmsDJq |
| yotpo.url           | 1039593                                                                                 |
## To Do

- [ ] Verify the Yotpo instance ID and URL in the `configs` sheet and make this block reference them, they are currently hardcoded.
- [ ] Review documentation and see how this reviews widget can be configured, add configurability to it so that, from the table in the block, I can add a key/value pair for any personalization options. Document them all in this readme.
- [ ] Test the Yotpo Reviews block integration on a staging environment.
- [ ] Looks like there are several types of blocks we could make, i.e. just stars, highlighted review, etc. Let's make different blocks for all the major pieces, this one would be renamed to `yotpo-product-review` or something that makes snese.
- [ ] Ensure the Yotpo script tags are correctly injected by `yotpo.js`.
- [ ] Validate the Yotpo Reviews block rendering on different devices and browsers.
- [ ] Update documentation with any changes or additional configuration steps.
