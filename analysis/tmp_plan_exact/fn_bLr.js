// ============================================================================
// fn: bLr   (bundle minified: function bLr()
// char range: 5454883..5455050   (byte range: 5463151..5463318)
// purpose: is inside a scrollable ancestor ([data-scrollable])
// params: target -> bool
// closure/global deps (auto-derived, approximate): bLr
// ============================================================================
function bLr(t){let e=t.closest("[data-scrollable]");for(;e;){if(e.scrollHeight>e.clientHeight)return!0;e=e.parentElement?.closest("[data-scrollable]")??null}return!1}
