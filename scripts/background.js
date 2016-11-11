'use strict';

//  Copyright (c) 2015 Christopher Kalafarski.
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.

// When the content script finds iTunes ID's it passes them in a message, which
// this event script will listen for. The event script queries the iTunes lookup
// API to get the RSS feed URL associated with each iTunes ID. That data gets
// placed in local storage so other parts of the extension can access it.

chrome.extension.onMessage.addListener((request, sender) => {
  if (request.msg == 'iTunesIDsFoundInContent') {
    const iTunesIDs = request.iTunesIDs;

    // Get the podcasts' RSS feed URLs from the iTunes API
    // eg: https://itunes.apple.com/lookup?id=12345,67890

    const url = `https://itunes.apple.com/lookup?id=${iTunesIDs.join(',')}`;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        const resp = JSON.parse(xhr.responseText);
        console.log(resp);

        if (resp && resp.results) {
          const podcasts = resp.results.map(result => {
            return {
              href: result.feedUrl,
              title: result.trackName,
              rel: 'Podcast',
              iTunesURL: result.collectionViewUrl
            }
          });

          chrome.storage.local.set({ [sender.tab.id]: podcasts }, () => {
            if (podcasts.length) {
              // `show` essentially enables the page action, it does *not* make the
              // pop-up visible in the browser window
              chrome.pageAction.show(sender.tab.id);
            }
          });
        }
      }
    }
    xhr.send();
  }
});

chrome.tabs.onRemoved.addListener(tabId => {
  chrome.storage.local.remove(tabId.toString());
});