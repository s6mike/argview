---
fixture: fixtures/theme.js
theme-element: node
theme-element-property: 0
---

# Node Theming

By default, borders are solid and rounded, titles are centred with a small padding around the text:

~~~yaml example="basic node theme"
name: default
~~~


![basic node theme](images/basicnodetheme-3dccffd3-90f2-4993-ac73-2ef3b095d8b5.png)

A theme can set the background color for a node
~~~yaml example="background-color"
name: default
backgroundColor: "#FFFFFF"
~~~

![background-color](images/background-color-6fc2fddf-9f21-4259-82fb-f967edf8294f.png)

A theme can set the corner radius for a node

~~~yaml example="corner-radius"
name: default
cornerRadius: 0
~~~

![corner-radius](images/corner-radius-fb04b0a8-ab82-4517-a867-467eb96c0ac3.png)


A theme can set the properties for a particular level 

~~~yaml example="level"
name: level_2
backgroundColor: "#FFFFFF"
cornerRadius: 0
~~~

![level](images/level-11b42911-d8d2-4c14-a29a-cf2387465688.png)


A theme can set border color, width and style

~~~yaml example="border"
name: default
border:
  type: surround
  line:
    color: "#AA0000"
    width: 5
    style: dashed
~~~

![border](images/border-1a1f762b-0a7b-4ef6-aeb3-3feb659c851b.png)



