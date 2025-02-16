# Store Locator Shared Block

Store locators for Edge Delivery Services, perhaps with an App Builder accompaniment.

## Technical Approach

Helix exposes the [store-locator/stores sheet](https://docs.google.com/spreadsheets/d/1zk2k46zqc73RS_NhzvkxTmgPbSRN0Vsunjla-tzUAyw/edit?gid=1909637118#gid=1909637118) as [hlx.live/store-locator/stores.json](https://main--showcase-evergreen-commerce-storefront--blueacorninc.hlx.live/store-locator/stores.json) that is consumed by the `store-locator` block in this directory.

with the AEM Sidekick installed, we can manage the entire store locator experience within Google Drive or Sharepoint. 

Edit [store-locator/stores sheet](https://docs.google.com/spreadsheets/d/1zk2k46zqc73RS_NhzvkxTmgPbSRN0Vsunjla-tzUAyw/edit?gid=1909637118#gid=1909637118) and use AEM Sidekick to Preview and Publish the changes. This will produce a [hlx.live/store-locator/stores.json](https://main--showcase-evergreen-commerce-storefront--blueacorninc.hlx.live/store-locator/stores.json) that we can drive our experience with the shared block.

The experience will be driven by a combination of this block and the [store-locator/index doc](https://docs.google.com/document/d/1PPViXzysO9FdQouEtEPp1pmww1NrJScWgIy0KxmKsPQ/edit?tab=t.0#heading=h.nbh8hvrzlmhd). The doc will contain a `store-locator` table that will be used to place and configure the block in runtime. 

## Installation 

Add the following file structure to your document-based project:

* [Store Locator Source Docs](https://drive.google.com/drive/u/0/folders/1jaCzCSbFBAAQPr0816HJuUqfMMGRcRiK)

Then configure the [stores sheet](https://docs.google.com/spreadsheets/d/1zk2k46zqc73RS_NhzvkxTmgPbSRN0Vsunjla-tzUAyw/edit?gid=1909637118#gid=1909637118) to suit your needs. 

## Sample Data

This is to be imported into a `/store-locator/stores.<xlsx|gsheet>` that tracks the stores and allows you to manage meta data. Data provided by data.gov where you can find the [source csv](https://opendata.dc.gov/api/download/v1/items/1d7c9d0e3aac49c1aa88d377a3bae430/csv?layers=4). This will also be reflected in the [stores sheet](https://docs.google.com/spreadsheets/d/1zk2k46zqc73RS_NhzvkxTmgPbSRN0Vsunjla-tzUAyw/edit?gid=1909637118#gid=1909637118)




 