# Frontex-oceanografic-services
Meteograms provides functionality to allow the user to get information about several meteorological variables at a certain point (latitude and longitude). The different parameters on a summarized presentation will be displayed, each of them being represented either in tabular or graphic format.

## Options
The user is allowed to select the time range of the forecast to be displayed, out of two possibilities:
●	48 h: Shows the 48 hour forecast with prediction shown hourly
●	7 days: Shows the 7 days forecast with prediction shown every 3 hours

## Configuration
Pass through the URL latitude and longitude parameters.
Example: .../?lat=latitude&long=longitude

## Dependencies
Highcharts is used for the graphical representation of the data.
Version: Highcharts JS v9.3.0