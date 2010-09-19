"use strict";
/*global action, events, Options, Platform, Tab, UI, Undo, Window */

if (Options.get("popup.type") === "bubble") {
    document.body.style.width = Options.get("popup.width") + "px";
    document.body.style.height = Options.get("popup.height") + "px";
    document.body.style.overflowY = "hidden";
    document.body.style.maxWidth = "100%";
}


Undo.setRule("new-tab", function (info) {
    Platform.tabs.remove(info.id);
    Undo.reset();
});

Undo.setRule("rename-window", function (info) {
    /*addEventListener("blur", function anon(event) {
        //this.removeEventListener(event.type, anon, true);
        event.preventDefault();
        event.stopPropagation();
    }, true);*/

    info.node.value = info.value;
    info.node.select();
    //info.focus.focus();
    Undo.reset();
});

Undo.setRule("select-tabs", function (info) {
    info.list.forEach(function (item) {
        //console.log(item.undoState.selected);
        if (item.undoState.selected) {
            item.queueAdd();
        } else {
            item.queueRemove();
        }
    });
    Undo.reset();
});

Undo.setRule("move-tabs", function (info) {
    var proxy = {};

    info.list.forEach(function (item) {
        Queue.push(function (queue) {
            var undo = item.undoState;
            var info = {
                index: undo.index
            };

            if (state.windows[undo.windowId]) {
                info.windowId = undo.windowId;
            } else {
                info.windowId = proxy[undo.windowId];
            }

            if (info.windowId) {
                Tab.move(item, info, item.queueAdd);
                queue.next();
            } else {
                Platform.windows.create({ url: "lib/remove.html" }, function (win) {
                    info.windowId = proxy[undo.windowId] = win.id;
                    Tab.move(item, info, item.queueAdd);
                    queue.next();
                });
            }
        });
    });
    Undo.reset();
});

//        Undo.setRule("close-tabs", function (info) {
//            Undo.reset();
//        });


//        Options.triggerEvent("change");

//        delete localStorage["search.lastinput"];
//        delete localStorage["window.titles"];

//        Options.set("titles", []);
//        Options.set("search.lastinput", "window:foob");

//        Options.set("titles", null);
//        Options.set("search.lastinput", null);


//!CLEANUP:
//        if (!"window.titles" in localStorage) {
//            localStorage["window.titles"] = JSON.stringify(Options.get("titles"));// || "";
//        }
//        if (!"search.lastinput" in localStorage) {
//            localStorage["search.lastinput"] = Options.get("search.lastinput") || "";
//        }


var state = {
    titles: Options.getObject(localStorage["window.titles"]),
    windows: {},
    tabs: {},
    queues: {
        moveAllTabs: function (id, index) {
            var queue = [];
            state.list.forEach(function (item) {
                queue = queue.concat(item.tabList.queue);
                item.tabList.queue.moveTabs(id, index, false);
            });

            if (queue.length && Options.get("undo.move-tabs")) {
                Undo.push("move-tabs", {
                    list: queue
                });

                if (queue.length === 1) {
                    state.undoBar.show("You moved " + queue.length + " tab.");
                } else {
                    state.undoBar.show("You moved " + queue.length + " tabs.");
                }
            }
        },
        resetAll: function () {
            state.list.forEach(function (item) {
                item.tabList.queue.reset();
                delete item.tabList.queue.shiftNode;
            });
        }
    },
    list: [],
    urlBar: UI.create("div", function (container) {
        container.id = "URL-bar";

        /*container.show = function () {
            container.style.display = "";
        };
        container.hide = function () {
            container.style.display = "none !important";
        };
        container.hide();*/
        container.setAttribute("hidden", "");

        document.body.appendChild(container);
    }),
    placeholder: UI.create("div", function (container) {
        container.id = "placeholder";
    })/*,
    dragBox: UI.create("div", function (element) {
        element.style.width = "380px";
        element.style.height = "auto";
        element.style.cssFloat = "left";
        element.style.padding = "2px";
        element.style.overflow = "hidden";
        element.style.backgroundColor = "transparent";
        element.style.height = "100px";
    })*/
};

//        Options.setDefaults({
//            titles: []
//        });


//        addEventListener("contextmenu", events.disable, true);
//        addEventListener("contextmenu", function (event) {
//            if (event.target.localName !== "input") {
//                event.preventDefault();
//            }
//        }, true);

/*document.body.addEventListener("focus", function (event) {
    console.log(event.target);
}, true);*/

document.body.tabIndex = -1;

addEventListener("focus", function (event) {
    var target = event.target;

    //console.log(event.type, target);

    //console.log(event.type);
    //console.log(document.activeElement, target);
    if (target.setAttribute) {
        target.setAttribute("focused", "");
        //if (target.className === "window") {
        //delete state.focused;
        //}

        if (state.focused) {
            state.focused.triggerEvent("blur", false, false);
        }
    }
}, true);
addEventListener("blur", function (event) {
    var target = event.target;

    //console.log(event.type, target);

    if (target.removeAttribute) {
        target.removeAttribute("focused");

        if (state.windowList.contains(target)) {
            state.focused = target;
        } else {
            delete state.focused;
        }
    }

    //console.log("FOCUSED", state.focused);

    //console.log(document.activeElement, target);
    //console.log(event.type);
    if (target === this && state.focused) {

        //console.log(state.focused);
        //this.focus();
        //state.focused.setAttribute("focused", "");
        //state.focused.setWindowFocus();
        //state.focused.blur();
        //state.focused.focus();
        state.focused.triggerEvent("focus", false, false);
        //delete state.focused;
    }
}, true);

addEventListener("dragstart", function () {
    state.dragging = true;
}, true);
addEventListener("dragover", function (event) {
    if (!event.defaultPrevented) {
        document.activeElement.blur();
    }
}, false);
addEventListener("dragend", function () {
    state.placeholder.remove();
    state.dragging = false;
}, true);


var fragment = document.createDocumentFragment();

fragment.appendChild(UI.create("table", function (container) {
    container.id = "container-buttons";

    container.appendChild(UI.create("button", function (button) {
        button.id = "button-new-window";
        button.title = "(Ctrl N)";
        button.className = "custom";
        button.textContent = "New Window";
        button.tabIndex = 1;

        button.addEventListener("click", function (event) {
            Platform.windows.create({/* url: "chrome://newtab/" */});
        }, true);

        button.addEventListener("dragover", events.disable, true);
        button.addEventListener("dragenter", button.focus, true);

        button.addEventListener("drop", function (event) {
            Platform.windows.create({ url: "lib/remove.html" }, function (win) {
                state.currentQueue.moveTabs(win.id);
                state.currentQueue.reset();
                delete state.currentQueue.shiftNode;
            });
        }, true);
    }));
/*!
    container.appendChild(UI.create("button", function (button) {
        button.className = "custom";
        button.textContent = "Reopen Closed Tab";
        button.tabIndex = 1;
    }));

    container.appendChild(UI.create("button", function (button) {
        button.className = "custom";
        button.textContent = "Foo";
        button.tabIndex = 1;
    }));
*/
    container.appendChild(UI.create("td", function (element) {
        element.className = "stretch";

        element.appendChild(UI.create("div", function (element) {
            element.id = "Undo-bar";

            element.appendChild(UI.create("div", function (element) {
                element.id = "Undo-bar-div";

                state.undoBar = element;

                element.hide = function (transition) {
                    if (transition !== true) {
                        element.style.webkitTransitionDuration = "0s";

                        setTimeout(function () {
                            element.style.webkitTransitionDuration = "";
                        }, 0);
                    }

                    element.style.opacity = "0 !important";
                    element.style.visibility = "hidden !important";

/*                        state.undoBar.addEventListener("webkitTransitionEnd", function anon(event) {
                        this.removeEventListener(event.type, anon, true);
                        this.style.webkitTransition = "";
                    }, true);*/
                };
                element.hide();

                var timer = {
                    reset: function () {
                        //console.log("Not timing!");
                        clearTimeout(timer.id);
                    },
                    set: function () {
                        //console.log("Timing!");
                        var ms = Options.get("undo.timer") * 1000;
                        timer.id = setTimeout(function () {
                            element.hide(true);
                        }, ms);
                    }
                };

                addEventListener("mouseover", function (event) {
                    //var element = document.elementFromPoint(event.clientX, event.clientY);
                    //console.log(container.contains(element));

                    var element = event.target;

                    if (container.contains(element)) {
                        if (!timer.mouseover) {
                            timer.mouseover = true;
                            timer.reset();
                        }
                    } else if (timer.mouseover) {
                        timer.mouseover = false;
                        timer.set();
                    }
                }, true);

                element.show = function (name) {
                    timer.reset();

                    state.undoBar.text = name;

                    element.style.opacity = "";
                    element.style.visibility = "";

                    if (!timer.mouseover) {
                        timer.set();
                    }
                };

                //setTimeout(element.show, 2000);
                //setTimeout(element.hide, 4000);

                /*addEventListener("focus", function (event) {
                    if (event.target !== document.body) {
                        element.hide();
                    }
                }, true);*/

                element.appendChild(UI.create("span", function (element) {
                    Object.defineProperty(state.undoBar, "text", {
                        get: function () {
                            return element.innerHTML;
                        },
                        set: function (value) {
                            element.innerHTML = value;
                        }
                    });
                }));

                element.appendChild(UI.create("span", function (element) {
                    element.id = "Undo-bar-button";
                    element.title = "(Ctrl Z)";
                    element.textContent = "Undo";

                    function undo() {
                        state.undoBar.hide();
                        Undo.pop();
                    }
                    element.addEventListener("click", undo, true);

                    addEventListener("keyup", function (event) {
                        var target = event.target;
                        if (target.localName === "input" && target.type === "text") {
                            return;
                        }

                        if (event.which === 90) {
                            if (event.ctrlKey || event.metaKey) {
                                if (!event.shiftKey && !event.altKey) {
                                    undo();
                                }
                            }
                        }
                    }, true);
                }));
            }));
        }));
    }));

    container.appendChild(UI.create("div", function (span) {
        span.id = "search-box";
        //span.textContent = "Search: ";

        var input = document.createElement("input");
        input.setAttribute("results", "");
        input.setAttribute("incremental", "");
        input.setAttribute("placeholder", "Search");
        //input.setAttribute("autocomplete", "on");
        //input.setAttribute("autosave", Platform.getURL(""));

        //input.setAttribute("autofocus", "");
        //input.setAttribute("autosave", "foobarqux");
        //input.setAttribute("accessKey", "f");
        //input.name = "search";
        input.title = "(Ctrl F)";
        input.type = "search";
        input.tabIndex = 1;

//                addEventListener("submit", function (event) {
//                    alert();
//                }, true);

        var lastinput = localStorage["search.lastinput"];
        if (typeof lastinput === "string") {
            input.value = lastinput;
        }

        var info = {
            //windows: document.getElementsByClassName("window"),
            //tabs: document.getElementsByClassName("tab"),
            title: document.title
        };

        function search(array, flags) {
            localStorage["search.lastinput"] = input.value;

            //var self = this;

            /*if (search.stop) {
                console.warn("Stop!");
                return;
            }
            search.stop = true;*/

            var tabs = Array.slice(document.getElementsByClassName("tab"));
            //var list = [];

            tabs = action.search(tabs, input.value);

            var list = array.filter(function (item) {
                var children = item.tabList.children;
                item.setAttribute("hidden", "");
                item.removeAttribute("last");

                Array.slice(children).forEach(function (child) {
                    if (child.hasAttribute("data-selected")) {
                        /*setTimeout(function () {
                            UI.scrollTo(child, item.tabList.scroll);
                        }, 0);*/
                        item.selected = child;
                    }
                    if (tabs.indexOf(child) !== -1) {
                        child.removeAttribute("hidden");
                        item.removeAttribute("hidden");
                    } else {
                        child.setAttribute("hidden", "");
                    }
                });

                if (!item.hasAttribute("hidden")) {
                    //list.push(item);
                    //var child = item.querySelector("[data-selected]");
                    if (flags.scroll) {
                        UI.scrollTo(item.selected, item.tabList.scroll);
                    }
                    return true;
                }
            });

            if (list.length) {
                list[list.length - 1].setAttribute("last", "");
            }

            /*var list = info.windows.length,
                tabs = info.tabs.length;*/

            var string = [ info.title, " (" ];

            if (tabs.length === 1) {
                string.push(tabs.length, " tab in ");
            } else {
                string.push(tabs.length, " tabs in ");
            }

            if (list.length === 1) {
                string.push(list.length, " window)");
            } else {
                string.push(list.length, " windows)");
            }

            document.title = string.join("");

            //search.stop = false;
        }

        state.search = function (info) {
            console.log("Searching.");

            /*if (array instanceof Array) {
                search(array);
            } else {*/
            search(state.list, Object(info));
            //}
        };
        //input.addEventListener("keyup", state.search, true);
        //input.addEventListener("click", state.search, true);
        //input.addEventListener("input", state.search, true);
        input.addEventListener("search", state.search, true);

        setTimeout(function () {
            input.focus();
            input.select();
        }, 0);

        addEventListener("keydown", function (event) {
            if (event.which === 70 && (event.ctrlKey || event.metaKey)) {
                if (!event.altKey && !event.shiftKey) {
                    event.preventDefault();
                    input.focus();
                    input.select();
                }
            }
        }, true);

        span.appendChild(input);
    }));
}));

fragment.appendChild(UI.create("table", function (element) {
    element.id = "window-list";
    element.className = "stretch";
    //element.style.display = "none !important";

    state.windowList = element;

    action.attachEvents(element);

//            state.update = function anon(event) {
//                //if (event.target.className) {
//                    clearTimeout(anon.timeout);
//                    anon.timeout = setTimeout(state.search, 50);
//                //}
//            };

    //var windowlist = document.getElementById("window-list");

//            setTimeout(function () {
//                Options.addEventListener("change", function () {
//                }, true);
//            }, 0);

    Platform.windows.getAll({ populate: true }, function (windows) {
        element.appendChild(UI.create("td"));

        windows.forEach(function (win) {
            if (win.type === "normal") {
                element.appendChild(Window.create(win));
            }
        });
        state.search({ scroll: true });

        element.appendChild(UI.create("td"));

        Options.addEventListener("change", function (event) {
            if (event.name === "window.lastfocused") {
                var item = state.windows[event.value];
                if (item) {
                    item.setWindowFocus();
                    state.search();
                }
            }
        }, true);

        addEventListener("unload", function () {
//                    Options.removeEventListener("change", update, true);

            var list = state.list.map(function (item) {
                return item.tabIcon.indexText.value;
            });

            localStorage["window.titles"] = JSON.stringify(list);
        }, true);

//                element.addEventListener("DOMSubtreeModified", state.update, true);
        //element.addEventListener("DOMNodeInserted", state.update, true);
        //element.addEventListener("DOMNodeRemoved", state.update, true);
    });
}));

document.body.appendChild(fragment);
