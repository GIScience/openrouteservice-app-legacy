/**
 * GUI component to search for places or POIs.
 * The search functionality is visible in an own panel.
 */
OpenRouteService.Gui.Search = Class.create(OpenRouteService.Gui, {
});

//when user has stopped typing for a given time, start search request
OpenRouteService.Gui.Search.DONE_TYPING_INTERVAL = 1200;