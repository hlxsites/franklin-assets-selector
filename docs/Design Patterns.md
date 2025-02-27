# Design Patterns

This is a list of design patterns we should follow, in no particular order:

## Do Not Modify Core Files

__this means css changes should occur in `styles/blueacorn-styles.css`__

We need to be sensitive of not modifying core files unless absolutely needed, we need to be in a position where we can easily `git merge upstream/main` to keep track with upstream Adobe changes. This means that for major files, like style.css and native block files, we need to not modify these. Let's implement the following practices to ensure that we're not modifying core:

1. do not edit native blocks, let's duplicate every block we change into a `blueacorn-` prefixed directory and update the appropriate layout docs

2. do not edit major css, js or html files in the codebase, as these changes will need to be merged and our changes are hard to track
    * Exceptions should be made for the head.html, but let's group our changes in the bottom of this file with a header comment suggesting it's a ba add
    * we should consider an approach where we build a block that is added to the nav/header that can house our changes without modifying head.html
    * add a `blueacorn-` prefix where apporpriate to selectors and ids to differentiate our files

3. Use `styles/blueacorn-styles.css` and create files like it to build our styling concerns

## Portable Blocks should inject their own script and link tags

Blocks like Yotpo and BazzarVoice should be completely portable, meaning that by copying the `blueacorn-yotpo` block (or `blueacorn/yotpo` would be cool if someone wants to try it) should basically be all it takes to port functionality into a storefront. 

This means that the decorator should first inject these tags, wait for the browser to catch up, and then instantiate and execute the needed code. In this scheme, no other code changes should be required.

## Small Repo Names

We really screwed up with the long repo name `showcase-evergreen-commerce-storefront` as the name is used in crafting the url and we're running into dns restrictions because of the length. Intending to rename to `blueacorn-shop`, suggest brevity in naming things here
