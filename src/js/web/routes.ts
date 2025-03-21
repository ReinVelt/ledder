
import ControlsPage from '../../pages/controls.svelte';
import SettingsPage from '../../pages/settings.svelte';

import AnimationRunner from '../../pages/animationrunner.svelte'

var routes = [
  {
    path: '/settings',
    component: SettingsPage,
    // keepAlive: true
  },
  {
    path: '/controls',
    component: ControlsPage,
    // keepAlive: true
  },
  // {
  //   path: '/:nameAndPreset*',
  //   component: AnimationRunner,
  //   viewName: 'animation-runner',
  //   browserHistory: true
  // },
  // {
  //   path: '/:animationName',
  //   component: AnimationRunner,
  //   viewName: 'animation-runner',
  //   browserHistory: true
  // },

  // {
  //   path: '/',
  //   component: CategoriesPage,
  // },

  // {
  //   path: '/dynamic-route/blog/:blogId/post/:postId/',
  //   component: DynamicRoutePage,
  // },
  // {
  //   path: '/request-and-load/user/:userId/',
  //   async: function ({ router, to, resolve }) {
  //     // App instance
  //     var app = router.app;
  //
  //     // Show Preloader
  //     app.preloader.show();
  //
  //     // User ID from request
  //     var userId = to.params.userId;
  //
  //     // Simulate Ajax Request
  //     setTimeout(function () {
  //       // We got user data from request
  //       var user = {
  //         firstName: 'Vladimir',
  //         lastName: 'Kharlampidi',
  //         about: 'Hello, i am creator of Framework7! Hope you like it!',
  //         links: [
  //           {
  //             title: 'Framework7 Website',
  //             url: 'http://framework7.io',
  //           },
  //           {
  //             title: 'Framework7 Forum',
  //             url: 'http://forum.framework7.io',
  //           },
  //         ]
  //       };
  //       // Hide Preloader
  //       app.preloader.hide();
  //
  //       // Resolve route to load page
  //       resolve(
  //         {
  //           component: RequestAndLoad,
  //         },
  //         {
  //           props: {
  //             user: user,
  //           }
  //         }
  //       );
  //     }, 1000);
  //   },
  // },
  // {
  //   path: '(.*)',
  //   component: NotFoundPage,
  // },
];

export default routes;
