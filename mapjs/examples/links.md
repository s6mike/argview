---
fixture: fixtures/link.js
initial-width: 1000
initial-height: 600
clip-x: 450
clip-y: 250
clip-width: 500
clip-height: 300
---

# Link properties

These examples show the effect of the link attributes of a node

## setting the color

~~~json example="color link"
{"color": "#ff5555"}
~~~

![color link](images/color_link-15b5c8f4-6b3f-41a9-9be6-0cd8b8cf0c34.png)

## setting the line type

~~~json example="dashed line type"
{
"color": "#000000",
"lineStyle": "dashed"
}
~~~

![dashed line type](images/dashed_line_type-1ba06a9f-e265-46d8-ac48-9f98effcefa8.png)

~~~json example="solid line type"
{
"lineStyle": "solid",
"color": "#000000"
}
~~~

![solid line type](images/solid_line_type-0a912392-bd4e-414e-b646-58e90f26c6ea.png)

## setting the arrow from

~~~json example="link arrow from"
{
"arrow": "from",
"color": "#000000"
}
~~~

![link arrow from](images/linkarrowfrom-30b4981e-a852-4537-bc39-82c8e690d79e.png)

## setting the arrow to

~~~json example="link arrow to"
{
"arrow": "to",
"color": "#000000"
}
~~~


![link arrow to](images/linkarrowto-2bfeb84d-4bfb-4e18-9f80-7db2ac5a5b23.png)


## setting the arrow both ends

~~~json example="link arrow both"
{
"arrow": "both",
"color": "#000000"
}
~~~

![link arrow both](images/linkarrowboth-8aa65c31-4557-40df-a426-85c64b01b80e.png)


## setting the arrow false

~~~json example="link arrow false"
{
"arrow": false,
"color": "#000000"
}
~~~


![link arrow false](images/linkarrowfalse-b9dbb5ed-b53f-4b51-b21b-80154ba5521b.png)

## setting the arrow true

~~~json example="link arrow"
{
"arrow": true,
"color": "#000000"
}
~~~

![link arrow](images/link_arrow.png)


## combining multiple attributes


~~~json example="link combination"
{
"arrow": true,
"color": "black",
"lineStyle": "dashed"
}
~~~

![link combination](images/link_combination-6156db52-9714-4d64-88a3-17d4de19eaf9.png)

## can paint label

~~~json example="with label"
{
"label": "some text"
}
~~~

![with label](images/with_label-c0275bf6-cc53-4d69-8ab8-a8f810e3b38b.png)

## line caps

Solid lines should have square end caps

~~~json example="straight caps"
{
  "lineStyle": "solid",
  "width": 10
}
~~~

![straight caps](images/straightcaps-a63c3d84-25d1-4358-823f-125faf62b820.png)

Dashed should not set any line end caps

~~~json example="dashed caps"
{
  "lineStyle": "dashed",
  "width": 10
}
~~~

![dashed caps](images/dashedcaps-bb26dc59-dd91-4db5-85c0-48f6f8aada9d.png)


Dotted should set rounded end caps

~~~json example="dotted caps"
{
  "lineStyle": "dotted",
  "width": 10
}
~~~

![dotted caps](images/dottedcaps-b2d9f973-c258-4826-a37f-fcad90905529.png)


## setting line width

Line width controls thickness

~~~json example="line width"
{
"width": 10,
"lineStyle": "solid"
}
~~~

![line width](images/linewidth-cc7dafca-51d9-452a-aded-e500bbde8f45.png)


Arrow head should also become thicker if width is set

~~~json example="width and arrows"
{
"width": 10,
"lineStyle": "solid",
"arrow": true
}
~~~

![width and arrows](images/widthandarrows-7eb0d5c9-6146-401a-887f-13df95335517.png)

Dash spacing should increase proportionally to width (4x)

~~~json example="width and dashes"
{
"arrow": true,
"width": 10,
"lineStyle": "dashed"
}
~~~

![width and dashes](images/widthanddashes-484b082b-022d-4a71-94a2-27a3b7f2d299.png)





