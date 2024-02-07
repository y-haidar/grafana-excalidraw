import { FieldConfigProperty, PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { SimplePanel } from './components/SimplePanel';
import { ExcalidrawEditor } from 'components/SimpleEditor';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel)
  .useFieldConfig({
    // useCustomConfig: (builder) =>
    //   builder.addFieldNamePicker({
    //     path: '',
    //     name: '',
    //   }),
    disableStandardOptions: [
      FieldConfigProperty.Unit,
      FieldConfigProperty.Decimals,
      FieldConfigProperty.DisplayName,
      FieldConfigProperty.NoValue,
      FieldConfigProperty.Color,
      FieldConfigProperty.Max, // Maybe support?
      FieldConfigProperty.Min, // Maybe support?
      FieldConfigProperty.Links, // Maybe support?
      FieldConfigProperty.Mappings, // Maybe support?
    ],
    // standardOptions: {
    //   // [FieldConfigProperty.Mappings]: {
    //   //   // settings: {
    //   //   //   icon: true,
    //   //   // },
    //   // },
    // },
  })
  .setPanelOptions((builder) => {
    return (
      builder
        // .addTextInput({
        //   path: 'text',
        //   name: 'Simple text option',
        //   description: 'Description of panel option',
        //   defaultValue: 'Default value of text input option',
        // })
        // .addBooleanSwitch({
        //   path: 'showSeriesCount',
        //   name: 'Show series counter',
        //   defaultValue: false,
        // })
        // .addBooleanSwitch({
        //   path: 'viewModeEnabled',
        //   name: 'Enable view mode',
        //   defaultValue: false,
        // })
        // .addRadio({
        //   path: 'seriesCountSize',
        //   defaultValue: 'sm',
        //   name: 'Series counter size',
        //   settings: {
        //     options: [
        //       {
        //         value: 'sm',
        //         label: 'Small',
        //       },
        //       {
        //         value: 'md',
        //         label: 'Medium',
        //       },
        //       {
        //         value: 'lg',
        //         label: 'Large',
        //       },
        //     ],
        //   },
        //   showIf: (config) => config.showSeriesCount,
        // })
        // .addTextInput({
        //   path: 'excalidraw_el',
        //   name: 'excalidraw_el',
        // })
        .addCustomEditor({
          id: 'excalidrawOptions',
          path: 'excalidrawOptions',
          name: 'Excalidraw Options',
          editor: ExcalidrawEditor,
        })
    );
  });
