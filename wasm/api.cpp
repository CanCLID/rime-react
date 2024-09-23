#include <boost/json/src.hpp>
#include <emscripten.h>
#include <rime_api.h>
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

int page_size = -1;
Bool enable_completion = -1;
Bool enable_correction = -1;
Bool enable_sentence = -1;
Bool enable_learning = -1;

template <typename T>
inline const char* to_json(T& obj) {
  json_string = boost::json::serialize(obj);
  return json_string.c_str();
}

void handler(void*,
             RimeSessionId session_id,
             const char* message_type,
             const char* message_value) {
  std::string value(message_value);
  EMIT_RIME_EVENT(message_type, value);
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

const char* process(Bool success) {
  boost::json::object result;
  result["success"] = !!success;
  if (rime->get_commit(session_id, &commit)) {
    result["committed"] = commit.text;
  }
  rime->free_commit(&commit);
  rime->get_context(session_id, &context);
  RimeComposition& composition = context.composition;
  result["isComposing"] = !!composition.length;
  if (composition.length) {
    std::string preedit = composition.preedit;
    boost::json::object pre_edit;
    pre_edit["before"] = preedit.substr(0, composition.sel_start);
    pre_edit["active"] = preedit.substr(
        composition.sel_start, composition.sel_end - composition.sel_start);
    pre_edit["after"] = preedit.substr(composition.sel_end);
    result["inputBuffer"] = pre_edit;
    RimeMenu& menu = context.menu;
    result["page"] = menu.page_no;
    result["isLastPage"] = !!menu.is_last_page;
    result["highlightedIndex"] = menu.highlighted_candidate_index;
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
    result["candidates"] = candidates;
  }
  rime->free_context(&context);
  return to_json(result);
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

void set_preference(const char* option, int value) {
  if (!strcmp(option, "pageSize")) {
    page_size = value;
  } else if (!strcmp(option, "enableCompletion")) {
    enable_completion = value;
  } else if (!strcmp(option, "enableCorrection")) {
    enable_correction = value;
  } else if (!strcmp(option, "enableSentence")) {
    enable_sentence = value;
  } else if (!strcmp(option, "enableLearning")) {
    enable_learning = value;
  }
}

const char* process_key(const char* input) {
  return process(rime->simulate_key_sequence(session_id, input));
}

const char* select_candidate(int index) {
  return process(rime->select_candidate_on_current_page(session_id, index));
}

const char* delete_candidate(int index) {
  return process(rime->delete_candidate_on_current_page(session_id, index));
}

const char* flip_page(bool backward) {
  return process(rime->change_page(session_id, backward));
}

const char* clear_input() {
  rime->clear_composition(session_id);
  return process(True);
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
