import {ActionView} from './components/ActionView.js';
import {DeleteConfirmView} from './components/DeleteConfirmView.js';
import {InputView} from './components/InputView.js';
import {ListView} from './components/ListView.js';
import {useCommandController} from './hooks/useCommandController.js';
import type {AppProps} from './appTypes.js';

export function App(props: AppProps) {
  const controller = useCommandController(props);

  if (controller.mode === 'deleteConfirm') {
    return <DeleteConfirmView command={controller.deleteCandidate} message={controller.message} />;
  }

  if (controller.mode === 'addAction' || controller.mode === 'editAction') {
    return (
      <ActionView
        action={controller.draftAction}
        categoryName={controller.currentCategoryName}
        command={controller.draftCommand}
        message={controller.message}
        mode={controller.mode}
        name={controller.draftName}
      />
    );
  }

  if (controller.mode !== 'list' && controller.mode !== 'search') {
    return (
      <InputView
        currentDefaultValue={controller.currentDefaultValue}
        inputValue={controller.inputValue}
        label={controller.inputLabel}
        message={controller.message}
        mode={controller.mode}
        onChange={controller.onInputChange}
        onSubmit={controller.onInputSubmit}
        templateCommand={controller.templateCommand}
        templateIndex={controller.templateIndex}
        templateNames={controller.templateNames}
      />
    );
  }

  return (
    <ListView
      categories={controller.categories}
      currentCategoryIndex={controller.currentCategoryIndex}
      inputValue={controller.inputValue}
      message={controller.message}
      mode={controller.mode}
      onSearchChange={controller.onSearchChange}
      onSearchSubmit={controller.onSearchSubmit}
      selectedIndex={controller.selectedIndex}
      visibleCommands={controller.visibleCommands}
    />
  );
}
