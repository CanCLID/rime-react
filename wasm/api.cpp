#include <boost/json/src.hpp>
#include <emscripten.h>
#include <rime_api.h>
#include <rime_levers_api.h>
#include <string>

#define APP_NAME "rime.react"
#define EMIT_RIME_EVENT(type, value)                                          \
  EM_ASM(onRimeEvent(UTF8ToString($0), JSON.parse(UTF8ToString($1))), (type), \
         to_json(value))

namespace rime_react {

RimeTraits traits = {0};
RimeSessionId session_id;
RimeCommit commit;
RimeContext context;
std::string json_string;
RimeApi* rime = rime_get_api();
RimeLeversApi* levers = nullptr;

template <typename T>
inline const char* to_json(const T& obj) {
  json_string = boost::json::serialize(obj);
  return json_string.c_str();
}

inline const char* to_json(const char* value) {
  json_string =
      boost::json::serialize(boost::json::string(value ? value : ""));
  return json_string.c_str();
}

RimeLeversApi* get_levers_api() {
  if (!levers) {
    RimeModule* module = rime->find_module("levers");
    if (module && module->get_api) {
      levers = reinterpret_cast<RimeLeversApi*>(module->get_api());
    }
  }
  return levers;
}

std::string current_schema_id() {
  RimeStatus status;
  RIME_STRUCT_INIT(RimeStatus, status);
  std::string schema_id;
  if (rime->get_status(session_id, &status)) {
    if (status.schema_id) {
      schema_id = status.schema_id;
    }
    rime->free_status(&status);
  }
  return schema_id;
}

bool update_custom_setting(const char* config_id,
                           const char* key,
                           int value,
                           bool is_bool) {
  if (!config_id || !key) {
    return false;
  }
  RimeLeversApi* levers_api = get_levers_api();
  if (!levers_api) {
    return false;
  }
  RimeCustomSettings* settings =
      levers_api->custom_settings_init(config_id, APP_NAME);
  if (!settings) {
    return false;
  }
  levers_api->load_settings(settings);
  Bool ok = False;
  if (value < 0) {
    RimeConfig config;
    if (levers_api->settings_get_config(settings, &config)) {
      std::string patch_key = std::string("patch/") + key;
      ok = rime->config_clear(&config, patch_key.c_str());
    }
  } else if (is_bool) {
    ok = levers_api->customize_bool(settings, key, value != 0);
  } else {
    ok = levers_api->customize_int(settings, key, value);
  }
  if (ok) {
    levers_api->save_settings(settings);
  }
  levers_api->custom_settings_destroy(settings);
  return ok;
}

void handler(void*,
             RimeSessionId session_id,
             const char* message_type,
             const char* message_value) {
  EMIT_RIME_EVENT(message_type, message_value);
  if (!strcmp(message_type, "deploy") && !strcmp(message_value, "success")) {
    boost::json::array schema_array;
    RimeSchemaList schema_list;
    rime->get_schema_list(&schema_list);
    for (size_t i = 0; i < schema_list.size; ++i) {
      boost::json::object schema;
      schema["id"] = schema_list.list[i].schema_id;
      schema["name"] = schema_list.list[i].name;
      schema_array.push_back(schema);
    }
    rime->free_schema_list(&schema_list);
    EMIT_RIME_EVENT("schema_list", schema_array);
  }
#ifdef RIME_HAS_SWITCHES_LIST
  if (!strcmp(message_type, "schema")) {
    boost::json::array switches_array;
    RimeSwitchesList switches_list;
    rime->get_switches_list(session_id, &switches_list);
    for (size_t i = 0; i < switches_list.size; ++i) {
      boost::json::object switch_option;
      switch_option["isRadio"] = (bool)switches_list.list[i].is_radio;
      switch_option["currentIndex"] = switches_list.list[i].current_index;
      switch_option["resetIndex"] = switches_list.list[i].reset_index;
      boost::json::array switch_array;
      for (size_t j = 0; j < switches_list.list[i].size; ++j) {
        boost::json::object switch_item;
        switch_item["name"] = switches_list.list[i].switches[j].name;
        switch_item["label"] = switches_list.list[i].switches[j].label;
        switch_item["abbrev"] = switches_list.list[i].switches[j].abbrev;
        switch_array.push_back(switch_item);
      }
      switch_option["switches"] = switch_array;
      switches_array.push_back(switch_option);
    }
    rime->free_switches_list(&switches_list);
    EMIT_RIME_EVENT("switches_list", switches_array);
  }
#endif
}

bool start_rime(bool restart) {
  rime->initialize(&traits);
  rime->set_notification_handler(handler, NULL);
  if (restart ? rime->start_maintenance(true) : rime->start_quick()) {
    rime->join_maintenance_thread();
    return true;
  }
  return false;
}

bool stop_rime() {
  if (rime->destroy_session(session_id)) {
    rime->finalize();
    return true;
  }
  return false;
}

void emit_input_status() {
  boost::json::object status;
  if (rime->get_commit(session_id, &commit)) {
    status["committed"] = commit.text;
  }
  rime->free_commit(&commit);
  rime->get_context(session_id, &context);
  RimeComposition& composition = context.composition;
  status["isComposing"] = !!composition.length;
  if (composition.length) {
    std::string preedit = composition.preedit;
    boost::json::object pre_edit;
    pre_edit["before"] = preedit.substr(0, composition.sel_start);
    pre_edit["active"] = preedit.substr(
        composition.sel_start, composition.sel_end - composition.sel_start);
    pre_edit["after"] = preedit.substr(composition.sel_end);
    status["inputBuffer"] = pre_edit;
    RimeMenu& menu = context.menu;
    status["page"] = menu.page_no;
    status["isLastPage"] = !!menu.is_last_page;
    status["highlightedIndex"] = menu.highlighted_candidate_index;
    boost::json::array candidates;
    for (size_t i = 0; i < menu.num_candidates; ++i) {
      boost::json::object candidate;
      candidate["label"] = context.select_labels && context.select_labels[i] &&
                                   *context.select_labels[i]
                               ? context.select_labels[i]
                               : std::to_string((i + 1) % 10) + '.';
      candidate["text"] = menu.candidates[i].text;
      if (menu.candidates[i].comment) {
        candidate["comment"] = menu.candidates[i].comment;
      }
      candidates.push_back(candidate);
    }
    status["candidates"] = candidates;
  }
  rime->free_context(&context);
  EMIT_RIME_EVENT("input", status);
}

extern "C" {

bool init() {
  RIME_STRUCT_INIT(RimeTraits, traits);
  traits.shared_data_dir = "/usr/share/rime-data";
  traits.user_data_dir = "/rime";
  traits.app_name = APP_NAME;
  rime->setup(&traits);
  RIME_STRUCT_INIT(RimeCommit, commit);
  RIME_STRUCT_INIT(RimeContext, context);
  if (start_rime(false)) {
    session_id = rime->create_session();
    rime->set_option(session_id, "soft_cursor", True);
    return true;
  }
  return false;
}

bool set_schema(const char* schema_id) {
  if (rime->destroy_session(session_id)) {
    session_id = rime->create_session();
    return rime->select_schema(session_id, schema_id);
  }
  return false;
}

void set_option(const char* option, int value) {
  rime->set_option(session_id, option, value);
}

bool set_preference(const char* option, int value) {
  if (!option) {
    return false;
  }
  const char* key = nullptr;
  bool is_bool = true;
  if (!strcmp(option, "pageSize")) {
    key = "menu/page_size";
    is_bool = false;
  } else if (!strcmp(option, "enableCompletion")) {
    key = "translator/enable_completion";
  } else if (!strcmp(option, "enableCorrection")) {
    key = "translator/enable_correction";
  } else if (!strcmp(option, "enableSentence")) {
    key = "translator/enable_sentence";
  } else if (!strcmp(option, "enableLearning")) {
    key = "translator/enable_user_dict";
  }
  if (!key) {
    return false;
  }
  std::string schema_id = current_schema_id();
  const char* config_id = schema_id.empty() ? "default" : schema_id.c_str();
  return update_custom_setting(config_id, key, value, is_bool);
}

bool process_key(const char* input) {
  Bool success = rime->simulate_key_sequence(session_id, input);
  emit_input_status();
  return success;
}

bool select_candidate(int index) {
  Bool success = rime->select_candidate_on_current_page(session_id, index);
  emit_input_status();
  return success;
}

bool delete_candidate(int index) {
  Bool success = rime->delete_candidate_on_current_page(session_id, index);
  emit_input_status();
  return success;
}

bool flip_page(bool backward) {
  Bool success = rime->change_page(session_id, backward);
  emit_input_status();
  return success;
}

void clear_input() {
  rime->clear_composition(session_id);
  emit_input_status();
}

bool deploy() {
  if (stop_rime() && start_rime(true)) {
    session_id = rime->create_session();
    rime->set_option(session_id, "soft_cursor", True);
    return true;
  }
  return false;
}
}

}  // namespace rime_react
