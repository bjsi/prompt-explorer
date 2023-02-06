import { RNPlugin, RemId, WidgetLocation } from '@remnote/plugin-sdk';

export const setLoading = async (plugin: RNPlugin, remId: RemId, loading: boolean) => {
  if (loading) {
    await plugin.app.registerWidget('loading', WidgetLocation.RightSideOfEditor, {
      remIdFilter: remId,
      dimensions: {
        height: 'auto',
        width: 'auto',
      },
    });
  } else {
    await plugin.app.unregisterWidget('loading', WidgetLocation.RightSideOfEditor);
  }
};
