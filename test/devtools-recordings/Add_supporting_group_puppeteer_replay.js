
import url from 'url';
import { createRunner } from '@puppeteer/replay';

export const flow = {
    "title": "Add_supporting_group",
    "steps": [
        {
            "type": "setViewport",
            "width": 1357,
            "height": 917,
            "deviceScaleFactor": 1,
            "isMobile": false,
            "hasTouch": false,
            "isLandscape": false
        },
        {
            "type": "navigate",
            "url": "file:///home/s6mike/git_projects/mapjs/test/index.html",
            "assertedEvents": [
                {
                    "type": "navigation",
                    "url": "file:///home/s6mike/git_projects/mapjs/test/index.html",
                    "title": ""
                }
            ]
        },
        {
            "type": "click",
            "target": "main",
            "selectors": [
                [
                    "aria/supporting group"
                ],
                [
                    "#testcontrols > input[type=button]:nth-child(6)"
                ]
            ],
            "offsetY": 12.627450942993164,
            "offsetX": 63.80390930175781,
            "deviceType": "pen"
        }
    ]
};

export async function run(extension) {
  const runner = await createRunner(flow, extension);
  await runner.run();
}

if (process && import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  await run();
}