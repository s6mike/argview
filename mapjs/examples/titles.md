---
fixture: fixtures/titles.js
---

# Node titles

By default, titles are centred with a small padding around the text:

~~~yaml example="basic node title"
title: hello
~~~

![basic node title](images/basicnodetitle-20461ca9-4bb3-48de-ae24-830fc363ed34.png)

New lines cause line breaks:

~~~yaml example="node titles with line breaks"
title: "hello\nthere\n3 lines"
~~~

![node titles with line breaks](images/nodetitleswithlinebreaks-8188af02-b936-4fad-896d-cf1229b204d2.png)

long text causes line wraps:

~~~yaml example="node title wrapping with default width"
title: "some long text is actually quite long and may get annoyingly long so it needs to wrap and wrap and automatically take up new lines"
~~~

![node title wrapping with default width](images/nodetitlewrappingwithdefaultwidth-0180b8f3-f2c0-42ca-aa51-482ff20e44a1.png)

Theme text maxWidth sets the wrapping boundary:

~~~yaml example="node title wrapping with theme width"
title: "some long text is actually quite long and may get annoyingly long so it needs to wrap and wrap and automatically take up new lines"
textTheme:
  maxWidth: 300
~~~

![node title wrapping with theme width](images/nodetitlewrappingwiththemewidth-bb4d9ad9-9e9d-430b-bae2-8d3a903bb838.png)

Theme text maxWidth does not expand the node if not needed:

~~~yaml example="short node title with theme width"
title: short
textTheme:
  maxWidth: 300
~~~

![short node title with theme width](images/shortnodetitlewiththemewidth-9ea7889e-24c2-4460-adf6-159b5722899d.png)


## Font multiplier stying

Font multiplier can control node text size

~~~json example="larger node title"
{
	"title": "hello",
	"style": {
		"fontMultiplier": 2.5
	}
}
~~~

Font multiplier can also decrease the font size

![larger node title](images/largernodetitle-5aeded0f-9a7a-4b84-926d-2c43771d69de.png)

~~~json example="smaller node title"
{
	"title": "hello",
	"style": {
		"fontMultiplier": 0.5
	}
}
~~~

![smaller node title](images/smallernodetitle-703907ee-4703-4a9f-ac94-0197a26a9cdb.png)

### Custom width

Specifying a width in the node style makes the node longer even if the text is narrower than the width

~~~yaml example="node title + width"
title: hello
style:
  width: 200
~~~

![node title + width](images/nodetitle+width-d3383f0b-cbf2-4465-8672-3db24d205230.png)

Long node titles wrap around the custom width

~~~yaml example="long node title + width"
title: hello hello hello hello hello hello hello hello hello hello hello hello hello hello hello hello
style:
  width: 200
~~~

![long node title + width](images/longnodetitle+width-d2ab95df-716a-4811-a9fd-702c4569740a.png)

Line breaks also work around custom width

~~~yaml example="long node title with line break + width"
title: "hello\nhello hello hello hello hello hello hello hello hello hello hello hello hello hello\nhello"
style:
  width: 200
~~~

![long node title with line break + width](images/longnodetitlewithlinebreak+width-0edf5253-54a6-4568-a8e7-48fbfc96c181.png)

Custom width takes precedence over theme max width if it is shorter

~~~yaml example="custom width shorter than theme"
title: "some long text is actually quite long and may get annoyingly long so it needs to wrap and wrap and automatically take up new lines"
style:
  width: 200
textTheme:
  maxWidth: 350
~~~

![custom width shorter than theme](images/customwidthshorterthantheme-45df74d8-4d70-4ea1-8444-2f3c6fc9e0e0.png)


~~~yaml example="custom width longer than theme"
title: "some long text is actually quite long and may get annoyingly long so it needs to wrap and wrap and automatically take up new lines"
style:
  width: 450
textTheme:
  maxWidth: 350
~~~

![custom width longer than theme](images/customwidthlongerthantheme-b97e6830-b45d-4be2-945f-97497bbea6f5.png)

### Text Alignment

Left aligned text


~~~json example="left aligned text"
{
  "title": "hello\nthere\nlonger line here",
  "style": {
    "textAlign": "left"
  }
}
~~~

![left aligned text](images/leftalignedtext-bd1a2ace-6736-4de4-8030-63cc010819c6.png)

Start aligned text


~~~json example="start aligned text"
{
  "title": "hello\nthere\nlonger line here",
  "style": {
    "textAlign": "start"
  }
}
~~~

![start aligned text](images/startalignedtext-bd1a2ace-6736-4de4-8030-63cc010819c6.png)

Right aligned text

~~~json example="right aligned text"
{
  "title": "hello\nthere\nlonger line here",
  "style": {
    "textAlign": "right"
  }
}
~~~

![right aligned text](images/rightalignedtext-b8db2855-ece5-4e29-a52d-c419740f8eb4.png)

Center aligned text

~~~json example="center aligned text"
{
  "title": "hello\nthere\nlonger line here",
  "style": {
    "textAlign": "center"
  }
}
~~~

![center aligned text](images/centeralignedtext-4fb01fb2-b9aa-4bc7-a357-eef49e595759.png)



