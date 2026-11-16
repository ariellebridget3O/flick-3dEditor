(() => {
function bLr(t){let e=t.closest("[data-scrollable]");for(;e;){if(e.scrollHeight>e.clientHeight)return!0;e=e.parentElement?.closest("[data-scrollable]")??null}return!1}
});
