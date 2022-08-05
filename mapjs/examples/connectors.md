---
fixture: fixtures/connector.js
initial-width: 1000
initial-height: 600
clip-x: 450
clip-y: 250
clip-width: 500
clip-height: 300
---

# Connector properties

These examples show the effect of the `parentConnector` attribute of a node

## basics

Without any properties, the connector uses the default theme style

~~~json example="basic connector"
{}
~~~

![basic connector](images/basic_connector-f22f968f-ab8f-40ee-948f-d4ebd306e298.png)


## setting the color 

~~~json example="color connector"
{"color": "#ff0000"}
~~~

![color connector](images/color_connector-478dc90f-ba12-4e0a-9214-819d7ed69f06.png)

## setting the line type

~~~json example="line type"
{"lineStyle": "dashed"}
~~~

![line type](images/line_type-b4679d54-b9bc-41b6-9993-ba5f0796875d.png)

## setting the label

~~~json example="line label"
{"label": "connecting nodes"}
~~~

![line label](images/line_label-5193ddb3-7850-40d7-b6c8-fcaca2b7d230.png)

