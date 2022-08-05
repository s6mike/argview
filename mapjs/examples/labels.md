---
fixture: fixtures/titles.js
---

# Node Labels

Labels show in the right-top corner of a node:
~~~yaml example="node with label"
title: EEEEE EEEE EEE
label: "1.1"
~~~

![node with label](images/nodewithlabel-5cdc1e30-bec0-4bd8-85e4-056066f820a9.png)


Labels do not get clipped when they are wider than a node

~~~yaml example="node with short text and label"
title: I
label: "1.1.1"
~~~

![node with short text and label](images/nodewithshorttextandlabel-e4d20a66-519d-4ab2-9d2b-d3fa3c184ba6.png)

Labels are not affected by the height of a node, they always show in the top-right corner

~~~yaml example="node with multiline text and label"
title: "EEEEE EEEEE\nEEEE EE\nEEE EEE"
label: "1.1"
~~~

![node with multiline text and label](images/nodewithmultilinetextandlabel-be4f3571-986a-4397-9965-7b9cf557a827.png)

