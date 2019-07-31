/*!
 *  PQfine JavaScript Library v1.0
 *  Author: zhaopuyang
 *  Date:   2019-07-31
 *  City:   Harbin in China
 */
(function () {
      PQfine = function (config) {
      this.$el = config.el;
      this.$data = config.data;
      this.$methods = config.methods;
      this.$rootnode = document.querySelector(this.$el);
      this.$map = [];

      this.shortcut();
      this.listen(this.$data);
      this.compile(this.$rootnode);
      this.bind();
   }
   PQfine.prototype = {
      compile: function (root) {
         for (var i = 0; i < root.childNodes.length; i++) {
            if (root.childNodes[i].nodeType == 1)//elem node
            {
               this.resolveInstructions(root.childNodes[i]);
               if (root.childNodes[i].childNodes.length > 0) {
                  this.compile(root.childNodes[i]);
               }
            }
            else if (root.childNodes[i].nodeType == 3)//text node
            {
               if (root.childNodes[i].parentNode.__compile__ === undefined) {
                  root.childNodes[i].parentNode.__compile__ = root.childNodes[i].nodeValue;
               }
               var self_instance = this;
               root.childNodes[i].nodeValue = root.childNodes[i].parentNode.__compile__.replace(/\{\{([\w.\[\]]+)\}\}/g, function ($1, $2) {
                  self_instance.$map.push({ node: root.childNodes[i].parentNode, data: $2 });
                  return eval('self_instance.$data.' + $2)
               })
            }
         }
      },
      render: function (name) {
         var self_instance = this;
         var items = this.$map.filter(function (n) {
            return self_instance.util.endWith.call(n.data, name) || n.data.indexOf("[" + name + "]") != -1 || n.node.__show__ == name
         });
         items.forEach(function (item) {
            self_instance.resolveInstructions(item.node);
            for (var i = 0; i < item.node.childNodes.length; i++) {
               if (item.node.childNodes[i].nodeType == 3) {
                  item.node.childNodes[i].nodeValue = item.node.__compile__.replace(/\{\{([\w.\[\]]+)\}\}/g, function ($1, $2) {
                     return eval('self_instance.$data.' + $2)
                  })
               }
            }
         });
      },
      util: {
         endWith: function (str) {
            var reg = new RegExp(str + "$");
            return reg.test(this)
         }
      },
      resolveInstructions: function (node) {
         var self_instance = this;
         /* v-show */
         if (node.hasAttribute(':show')) {
            node.__show__ = node.getAttribute(':show');
            node.removeAttribute(':show');
         }
         if (node.__show__) {
            node.style.display = this.$data[node.__show__] ? 'block' : 'none';
         }
         /* v-for */
         if (node.hasAttribute(':for')) {
            var value = node.getAttribute(':for');
            (/(\w+)\s+in\s+(\w+)/g).exec(value);
            var item = RegExp.$1;
            var items = RegExp.$2;
            for (var j = 0; j < this.$data[items].length; j++) {
               var newNode = document.createElement(node.tagName);
               newNode.innerText = node.innerText.replace(eval("/" + item + "/g"), function () { return items + "[" + j + "]" })
               node.parentNode.appendChild(newNode)
            }
            node.parentNode.removeChild(node)
         }
         /* v-event */
         for (var i = 0; i < node.attributes.length; i++) {
            (function () {
               var data = (/@(\w+)/g).exec(node.attributes[0].nodeName);
               if (data) {
                  var eventAttr = data[0];
                  var event = data[1];
                  var callback = node.attributes[0].nodeValue;
                  node.addEventListener(event, function (e) {
                     var containArg = callback.indexOf('(');
                     self_instance.$methods.$event = e;
                     eval('self_instance.$methods.' + callback + (containArg != -1 ? "" : "()"));
                  });
                  node.removeAttribute(eventAttr);
               }
            })()
         }
      },
      bind: function () {
         var self_instance = this;
         document.querySelector(this.$el + ' ' + 'input[type="text"]', this.$el + ' ' + 'input[type="checkbox"]').addEventListener('input', function () {
            if (this.hasAttribute(':model')) {
               this.__model__ = this.getAttribute(':model');
               this.removeAttribute(':model');
            }
            if (this.__model__) {
               self_instance.$data[this.__model__] = this.value;
            }
         })
         document.querySelector(this.$el + ' ' + 'input[type="text"]', this.$el + ' ' + 'input[type="checkbox"]').addEventListener('propertychange', function () {
            if (this.hasAttribute(':model')) {
               this.__model__ = this.getAttribute(':model');
               this.removeAttribute(':model');
            }
            if (this.__model__) {
               self_instance.$data[this.__model__] = this.value;
            }
         })
      },
      shortcut: function () {
         for (var prop in this.$data) {
            this[prop] = this.$data[prop]
         }
      },
      listen: function (obj) {
         var self_instance = this;
         for (var prop in obj) {
            var val = obj[prop];
            (function (prop, val) {
               if (typeof obj[prop] === 'object') {
                  self_instance.listen(obj[prop])
               }
               Object.defineProperty(obj, prop, {
                  get: function () {
                     return val;
                  },
                  set: function (value) {
                     if (val !== value) {
                        val = value;
                        if (typeof val !== 'object') {
                           self_instance[prop] = value;
                        }
                        self_instance.render(prop)
                     }
                  }
               })
            })(prop, val)
         }
      }
   }
}())