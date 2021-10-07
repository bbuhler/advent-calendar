function noop() { }
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.data !== data)
        text.data = data;
}

let current_component;
function set_current_component(component) {
    current_component = component;
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function tick() {
    schedule_update();
    return resolved_promise;
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
function flush() {
    const seen_callbacks = new Set();
    do {
        // first, call beforeUpdate functions
        // and update components
        while (dirty_components.length) {
            const component = dirty_components.shift();
            set_current_component(component);
            update(component.$$);
        }
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                callback();
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
}
function update($$) {
    if ($$.fragment) {
        $$.update($$.dirty);
        run_all($$.before_update);
        $$.fragment.p($$.dirty, $$.ctx);
        $$.dirty = null;
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    if (component.$$.fragment) {
        run_all(component.$$.on_destroy);
        component.$$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        component.$$.on_destroy = component.$$.fragment = null;
        component.$$.ctx = {};
    }
}
function make_dirty(component, key) {
    if (!component.$$.dirty) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty = blank_object();
    }
    component.$$.dirty[key] = true;
}
function init(component, options, instance, create_fragment, not_equal, prop_names) {
    const parent_component = current_component;
    set_current_component(component);
    const props = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props: prop_names,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty: null
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, props, (key, value) => {
            if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                if ($$.bound[key])
                    $$.bound[key](value);
                if (ready)
                    make_dirty(component, key);
            }
        })
        : props;
    $$.update();
    ready = true;
    run_all($$.before_update);
    $$.fragment = create_fragment($$.ctx);
    if (options.target) {
        if (options.hydrate) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment.l(children(options.target));
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set() {
        // overridden by instance, if it has props
    }
}

/* src/index.svelte generated by Svelte v3.7.1 */

function add_css() {
	var style = element("style");
	style.id = 'svelte-47e3di-style';
	style.textContent = "img.svelte-47e3di{max-width:100%}.holder.svelte-47e3di{position:relative;box-sizing:border-box}.holder.svelte-47e3di .svelte-47e3di,.holder.svelte-47e3di .svelte-47e3di::before,.holder.svelte-47e3di .svelte-47e3di::after{box-sizing:inherit}.full-absolute.svelte-47e3di{position:absolute;top:0;right:0;bottom:0;left:0}.doors.svelte-47e3di{display:grid;grid-template-columns:repeat(4, 100px [col-start]);justify-content:space-evenly;align-content:space-evenly}.door.svelte-47e3di{position:relative;display:flex;align-items:center;justify-content:center;height:100px;border:1px dashed rgba(255, 255, 255, .75);border-left-style:solid;color:#fff}.door.svelte-47e3di .cover.svelte-47e3di{--open-angle:-105deg;display:flex;justify-content:center;align-items:center;transform-origin:left;transition:transform .5s ease-in-out;cursor:pointer}.hinges-right.svelte-47e3di .door .cover.svelte-47e3di{--open-angle:105deg;transform-origin:right}.door.svelte-47e3di .content.svelte-47e3di{background:#333;opacity:0;transition:opacity .5s ease-in-out}.door.svelte-47e3di .back.svelte-47e3di{background:#999;opacity:0;transition:opacity .25s ease-in}.door.open .cover.svelte-47e3di{transform:perspective(1200px) translate3d(0, 0, 0) rotateY(var(--open-angle));border:1px solid #fff;filter:drop-shadow(-4px 4px 10px #000)}.door.open .content.svelte-47e3di{opacity:1}.door.open .back.svelte-47e3di{transition:opacity .25s ease-in .25s;opacity:.9}";
	append(document.head, style);
}

function get_each_context(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.door = list[i];
	child_ctx.each_value = list;
	child_ctx.door_index = i;
	return child_ctx;
}

// (141:4) {#each doors as door}
function create_each_block(ctx) {
	var div3, div0, door = ctx.door, t0, div2, t1_value = ctx.door.id, t1, t2, div1, t3, dispose;

	const assign_div0 = () => ctx.div0_binding(div0, door);
	const unassign_div0 = () => ctx.div0_binding(null, door);

	const assign_div2 = () => ctx.div2_binding(div2, door);
	const unassign_div2 = () => ctx.div2_binding(null, door);

	function click_handler() {
		return ctx.click_handler(ctx);
	}

	return {
		c() {
			div3 = element("div");
			div0 = element("div");
			t0 = space();
			div2 = element("div");
			t1 = text(t1_value);
			t2 = space();
			div1 = element("div");
			t3 = space();
			attr(div0, "class", "full-absolute content svelte-47e3di");
			attr(div1, "class", "full-absolute back svelte-47e3di");
			attr(div2, "class", "full-absolute cover svelte-47e3di");
			attr(div3, "class", "door svelte-47e3di");
			dispose = listen(div2, "click", click_handler);
		},

		m(target, anchor) {
			insert(target, div3, anchor);
			append(div3, div0);
			assign_div0();
			append(div3, t0);
			append(div3, div2);
			append(div2, t1);
			append(div2, t2);
			append(div2, div1);
			assign_div2();
			append(div3, t3);
		},

		p(changed, new_ctx) {
			ctx = new_ctx;
			if (door !== ctx.door) {
				unassign_div0();
				door = ctx.door;
				assign_div0();
			}

			if ((changed.doors) && t1_value !== (t1_value = ctx.door.id)) {
				set_data(t1, t1_value);
			}

			if (door !== ctx.door) {
				unassign_div2();
				door = ctx.door;
				assign_div2();
			}
		},

		d(detaching) {
			if (detaching) {
				detach(div3);
			}

			unassign_div0();
			unassign_div2();
			dispose();
		}
	};
}

function create_fragment(ctx) {
	var div1, img_1, t, div0, div0_class_value;

	var each_value = ctx.doors;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	return {
		c() {
			div1 = element("div");
			img_1 = element("img");
			t = space();
			div0 = element("div");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			attr(img_1, "src", ctx.bg);
			attr(img_1, "alt", ctx.bgAlt);
			attr(img_1, "class", "svelte-47e3di");
			attr(div0, "class", div0_class_value = "doors full-absolute hinges-" + ctx.hinges + " svelte-47e3di");
			attr(div1, "class", "holder svelte-47e3di");
		},

		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, img_1);
			ctx.img_1_binding(img_1);
			append(div1, t);
			append(div1, div0);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div0, null);
			}
		},

		p(changed, ctx) {
			if (changed.bg) {
				attr(img_1, "src", ctx.bg);
			}

			if (changed.bgAlt) {
				attr(img_1, "alt", ctx.bgAlt);
			}

			if (changed.doors) {
				each_value = ctx.doors;

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(div0, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value.length;
			}

			if ((changed.hinges) && div0_class_value !== (div0_class_value = "doors full-absolute hinges-" + ctx.hinges + " svelte-47e3di")) {
				attr(div0, "class", div0_class_value);
			}
		},

		i: noop,
		o: noop,

		d(detaching) {
			if (detaching) {
				detach(div1);
			}

			ctx.img_1_binding(null);

			destroy_each(each_blocks, detaching);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { bg, bgAlt, loadContent, hinges = '' } = $$props;

  let img;

  const doors = Array.apply(null, Array(24)).map((v, i) => ({ id: i + 1 }));

  async function open({ id, cover, content })
  {
    const { classList, offsetLeft, offsetTop } = cover.parentNode;

    if (classList.contains('open'))
    {
      // TODO hide content after animation has finished
      classList.remove('open');
    }
    else try
    {
      cover.style.background = `url(${img.src}) -${offsetLeft + 1}px -${offsetTop + 1}px / ${img.width}px ${img.height}px`;
      content.innerHTML = await loadContent(id);

      await tick();

      classList.add('open');
    }
    catch(err)
    {
      // TODO add user feedback like flashing animation
      console.error(err);
    }
  }

	function img_1_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			$$invalidate('img', img = $$value);
		});
	}

	function div0_binding($$value, door) {
		if (door.content === $$value) return;
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			door.content = $$value;
			$$invalidate('door', door);
		});
	}

	function div2_binding($$value, door) {
		if (door.cover === $$value) return;
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			door.cover = $$value;
			$$invalidate('door', door);
		});
	}

	function click_handler({ door }) {
		return open(door);
	}

	$$self.$set = $$props => {
		if ('bg' in $$props) $$invalidate('bg', bg = $$props.bg);
		if ('bgAlt' in $$props) $$invalidate('bgAlt', bgAlt = $$props.bgAlt);
		if ('loadContent' in $$props) $$invalidate('loadContent', loadContent = $$props.loadContent);
		if ('hinges' in $$props) $$invalidate('hinges', hinges = $$props.hinges);
	};

	return {
		bg,
		bgAlt,
		loadContent,
		hinges,
		img,
		doors,
		open,
		img_1_binding,
		div0_binding,
		div2_binding,
		click_handler
	};
}

class Index extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-47e3di-style")) add_css();
		init(this, options, instance, create_fragment, safe_not_equal, ["bg", "bgAlt", "loadContent", "hinges"]);
	}
}

export default Index;
